export const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return {
    id: obj._id?.toString() || obj.id,
    name: obj.name,
    email: obj.email,
    role: obj.role,
    location: obj.location,
    farmSize: obj.farmSize,
    profileImage: obj.profileImage,
    phone: obj.phone,
    preferences: obj.preferences,
    city: obj.city,
    state: obj.state,
    country: obj.country,
    pincode: obj.pincode,
    address: obj.address,
    gender: obj.gender,
    dob: obj.dob,
    isVerified: obj.isVerified,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

export const formatRelativeTime = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};
