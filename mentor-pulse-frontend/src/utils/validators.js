// Validation functions will go here
export const validators = {
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  isRequired: (value) => {
    return value !== null && value !== undefined && value !== '';
  }
};

