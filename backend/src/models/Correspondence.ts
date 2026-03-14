import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface CorrespondenceAttributes {
  id: number;
  reference_number: string;
  correspondence_number?: string;
  type: 'incoming' | 'outgoing';
  correspondence_method?: 'hand' | 'computer';
  subject: string;
  description: string;
  specialized_branch?: string;
  responsible_person?: string;
  sender_entity_id: number;
  receiver_entity_id: number;
  correspondence_date: Date;
  review_status: 'reviewed' | 'not_reviewed';
  current_status: 'draft' | 'sent' | 'received' | 'under_review' | 'replied' | 'closed';
  storage_location?: string;
  created_by: number;
  reviewed_by?: number;
  reviewed_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface CorrespondenceCreationAttributes extends Partial<CorrespondenceAttributes> {}

class Correspondence extends Model<CorrespondenceAttributes, CorrespondenceCreationAttributes> implements CorrespondenceAttributes {
  public id!: number;
  public reference_number!: string;
  public correspondence_number?: string;
  public type!: 'incoming' | 'outgoing';
  public correspondence_method?: 'hand' | 'computer';
  public subject!: string;
  public description!: string;
  public specialized_branch?: string;
  public responsible_person?: string;
  public sender_entity_id!: number;
  public receiver_entity_id!: number;
  public correspondence_date!: Date;
  public review_status!: 'reviewed' | 'not_reviewed';
  public current_status!: 'draft' | 'sent' | 'received' | 'under_review' | 'replied' | 'closed';
  public storage_location?: string;
  public created_by!: number;
  public reviewed_by?: number;
  public reviewed_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public deleted_at?: Date;
}

Correspondence.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    reference_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    correspondence_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('incoming', 'outgoing'),
      allowNull: false,
    },
    correspondence_method: {
      type: DataTypes.ENUM('hand', 'computer'),
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    specialized_branch: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    responsible_person: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    sender_entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'entities',
        key: 'id',
      },
    },
    receiver_entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'entities',
        key: 'id',
      },
    },
    correspondence_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    review_status: {
      type: DataTypes.ENUM('reviewed', 'not_reviewed'),
      defaultValue: 'not_reviewed',
    },
    current_status: {
      type: DataTypes.ENUM('draft', 'sent', 'received', 'under_review', 'replied', 'closed'),
      defaultValue: 'draft',
    },
    storage_location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reviewed_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reviewed_at: {
      type: DataTypes.DATE,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    tableName: 'correspondences',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['reference_number'] },
      { fields: ['type'] },
      { fields: ['sender_entity_id'] },
      { fields: ['receiver_entity_id'] },
      { fields: ['correspondence_date'] },
      { fields: ['review_status'] },
      { fields: ['current_status'] },
      { fields: ['created_by'] },
    ],
  }
);

export default Correspondence;

