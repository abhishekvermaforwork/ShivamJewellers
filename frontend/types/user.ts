export type User = {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

export type BusinessProfile = {
  businessName?: string;
  logoUrl?: string;
  invoicePrefix?: string;
};
