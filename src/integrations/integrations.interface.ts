interface Integrations {
  _id: string;
  user_id: string;
  alias: string;
  access_token: string;
  client_id: string;
  client_secret: string;
  service: string;
  createdAt:Date;
  is_deleted?: boolean;
}

export default Integrations;
