const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Category name'
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Parent category ID for hierarchy'
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Display order position'
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Active status'
    },
    image: {
      type: DataTypes.STRING(100),
      defaultValue: 'def.png',
      allowNull: true,
      comment: 'Category image filename'
    },
    banner_image: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Category banner image filename'
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      allowNull: false,
      comment: 'Priority for sorting'
    }
  }, {
    tableName: 'categories',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['parent_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['position']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['name']
      }
    ],
    scopes: {
      // Active categories only
      active: {
        where: {
          status: true
        }
      },
      // Root categories (no parent)
      root: {
        where: {
          parent_id: null
        }
      },
      // Child categories (has parent)
      child: {
        where: {
          parent_id: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      // Ordered by position
      ordered: {
        order: [['position', 'ASC']]
      },
      // Ordered by priority
      prioritized: {
        order: [['priority', 'ASC']]
      }
    }
  });

  // Instance methods
  Category.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Add computed fields
    values.image_full_path = this.getImageFullPath();
    values.banner_image_full_path = this.getBannerImageFullPath();
    values.is_parent = this.parent_id === null;
    values.has_children = this.children && this.children.length > 0;
    
    return values;
  };

  // Get image full path
  Category.prototype.getImageFullPath = function() {
    if (!this.image || this.image === 'def.png') {
      return '/uploads/default/category-placeholder.png';
    }
    return `/uploads/category/${this.image}`;
  };

  // Get banner image full path
  Category.prototype.getBannerImageFullPath = function() {
    if (!this.banner_image) {
      return '/uploads/default/category-banner-placeholder.png';
    }
    return `/uploads/category/banner/${this.banner_image}`;
  };

  // Check if category is root (no parent)
  Category.prototype.isRoot = function() {
    return this.parent_id === null;
  };

  // Check if category has children
  Category.prototype.hasChildren = function() {
    return this.children && this.children.length > 0;
  };

  // Get category level (0 for root, 1 for first level children, etc.)
  Category.prototype.getLevel = function() {
    if (this.isRoot()) return 0;
    
    let level = 1;
    let current = this.parent;
    while (current && current.parent_id) {
      level++;
      current = current.parent;
    }
    return level;
  };

  // Get all ancestor categories
  Category.prototype.getAncestors = async function() {
    const ancestors = [];
    let current = this.parent;
    
    while (current) {
      ancestors.unshift(current);
      if (current.parent_id) {
        current = await Category.findByPk(current.parent_id, {
          include: [{ 
            model: Category, 
            as: 'parent',
            required: false
          }]
        });
      } else {
        break;
      }
    }
    
    return ancestors;
  };

  // Get category breadcrumb
  Category.prototype.getBreadcrumb = async function() {
    const ancestors = await this.getAncestors();
    const breadcrumb = ancestors.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.name.toLowerCase().replace(/\s+/g, '-')
    }));
    
    breadcrumb.push({
      id: this.id,
      name: this.name,
      slug: this.name.toLowerCase().replace(/\s+/g, '-')
    });
    
    return breadcrumb;
  };

  // Static methods
  Category.findActive = function(options = {}) {
    return this.scope('active').findAll(options);
  };

  Category.findRoot = function(options = {}) {
    return this.scope(['active', 'root', 'ordered']).findAll(options);
  };

  Category.findChildren = function(parentId, options = {}) {
    return this.scope(['active', 'ordered']).findAll({
      where: { parent_id: parentId },
      ...options
    });
  };

  Category.buildTree = async function(parentId = null, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) return [];
    
    const categories = await this.scope(['active', 'ordered']).findAll({
      where: { parent_id: parentId }
    });
    
    const tree = [];
    for (const category of categories) {
      const categoryData = category.toJSON();
      categoryData.children = await this.buildTree(category.id, maxDepth, currentDepth + 1);
      tree.push(categoryData);
    }
    
    return tree;
  };

  Category.getHierarchy = async function() {
    return await this.buildTree();
  };

  Category.findByName = function(name) {
    return this.scope('active').findOne({
      where: {
        name: {
          [sequelize.Sequelize.Op.iLike]: `%${name}%`
        }
      }
    });
  };

  Category.search = function(query, options = {}) {
    return this.scope('active').findAll({
      where: {
        name: {
          [sequelize.Sequelize.Op.iLike]: `%${query}%`
        }
      },
      ...options
    });
  };

  // Model associations
  Category.associate = function(_models) {
    // Self-referential relationship for hierarchy
    Category.belongsTo(Category, {
      foreignKey: 'parent_id',
      as: 'parent',
      onDelete: 'SET NULL'
    });

    Category.hasMany(Category, {
      foreignKey: 'parent_id',
      as: 'children',
      onDelete: 'CASCADE'
    });

    // Category has many products (through category_ids JSON field)
    // This will be handled in the Product model due to the JSON relationship
    // Note: Products store category relationships via JSON field category_ids

    // Future associations (commented out until models are created)
    
    // // Category has many banners
    // if (models.Banner) {
    //   Category.hasMany(models.Banner, {
    //     foreignKey: 'category_id',
    //     as: 'banners'
    //   });
    // }

    // // Category has many translations (if implementing i18n)
    // if (models.Translation) {
    //   Category.hasMany(models.Translation, {
    //     foreignKey: 'translationable_id',
    //     as: 'translations',
    //     scope: {
    //       translationable_type: 'Category'
    //     }
    //   });
    // }
  };

  return Category;
}; 