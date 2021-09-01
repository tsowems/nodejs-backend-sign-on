interface User {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  userRole: string;
  password: string;
  userCode: string;
  profile?: {
    company: string;
    imageUrl: string;
    referral: string;
  };
  status: string;
  refreshToken: string;
}

export default User;
