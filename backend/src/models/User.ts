import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface UserAttributes {
  id?: number;
  username: string;
  email: string;
  password_hash: string;
  full_name_ar: string;
  full_name_en?: string;
  role_id: number;
  is_active: boolean;
  last_login?: Date;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface UserCreationAttributes extends Partial<UserAttributes> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password_hash!: string;
  public full_name_ar!: string;
  public full_name_en?: string;
  public role_id!: number;
  public is_active!: boolean;
  public last_login?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public deleted_at?: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    full_name_ar: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    full_name_en: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: {
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
    tableName: 'users',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['username'] },
      { fields: ['email'] },
      { fields: ['role_id'] },
      { fields: ['is_active'] },
    ],
  }
);

export default User;

