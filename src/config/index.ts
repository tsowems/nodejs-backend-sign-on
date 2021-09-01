import * as dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT;
export const ENVIRONMENT = process.env.NODE_ENV;
export const APP_URL = process.env.APP_URL;
export const BASE_PATH = process.env.BASE_PATH;
export const DB_NAME = process.env.DB_NAME;
export const DB_USER = process.env.DB_USER;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_HOST = process.env.DB_HOST;
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_RESET_PASSWORD = process.env.JWT_RESET_PASSWORD;
export const ALTER_STATE = process.env.ALTER_STATE;

export const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
export const CLIENT_URL = process.env.CLIENT_URL;
export const EMAIL_FROM = process.env.EMAIL_FROM;

export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const S3_REGION = process.env.S3_REGION;
export const S3_BUCKET = process.env.S3_BUCKET;

export const GMAIL_USERNAME = process.env.GMAIL_USERNAME;
export const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;

export const WEBFLOW_CLIENT_ID = process.env.WEBFLOW_CLIENT_ID;
export const WEBFLOW_CLIENT_SECRET = process.env.WEBFLOW_CLIENT_SECRET;
