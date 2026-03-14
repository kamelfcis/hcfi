'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('correspondences', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      reference_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      correspondence_number: {
        type: Sequelize.STRING(100),
      },
      type: {
        type: Sequelize.ENUM('incoming', 'outgoing'),
        allowNull: false,
      },
      correspondence_method: {
        type: Sequelize.ENUM('hand', 'computer'),
      },
      subject: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      specialized_branch: {
        type: Sequelize.STRING(255),
      },
      responsible_person: {
        type: Sequelize.STRING(255),
      },
      sender_entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'entities',
          key: 'id',
        },
      },
      receiver_entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'entities',
          key: 'id',
        },
      },
      correspondence_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      review_status: {
        type: Sequelize.ENUM('reviewed', 'not_reviewed'),
        defaultValue: 'not_reviewed',
      },
      current_status: {
        type: Sequelize.ENUM('draft', 'sent', 'received', 'under_review', 'replied', 'closed'),
        defaultValue: 'draft',
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      reviewed_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      reviewed_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('correspondences', ['reference_number'], { unique: true });
    await queryInterface.addIndex('correspondences', ['correspondence_number']);
    await queryInterface.addIndex('correspondences', ['type']);
    await queryInterface.addIndex('correspondences', ['sender_entity_id']);
    await queryInterface.addIndex('correspondences', ['receiver_entity_id']);
    await queryInterface.addIndex('correspondences', ['correspondence_date']);
    await queryInterface.addIndex('correspondences', ['review_status']);
    await queryInterface.addIndex('correspondences', ['current_status']);
    await queryInterface.addIndex('correspondences', ['created_by']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('correspondences');
  },
};

