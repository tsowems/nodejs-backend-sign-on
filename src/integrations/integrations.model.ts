import * as mongoose from 'mongoose';
import Integrations from './integrations.interface';

const integrationsSchema = new mongoose.Schema(
  {
    alias: String,
    access_token: String,
    client_id: String,
    client_secret: String,
    code:String,
    service: String,
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt:String,

  },
  {
    toJSON: {
      virtuals: true,
      getters: true,
    },
  },
);


const integrationsModel = mongoose.model<Integrations & mongoose.Document>('Integrations', integrationsSchema);

export default integrationsModel;
