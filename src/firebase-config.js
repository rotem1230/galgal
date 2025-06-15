export const checkIfUserIsAdmin = async (email) => {
  try {
    if (email === 'rotemhaha321@gmail.com' || email === 'kfirgal505@gmail.com') {
      return true;
    }
    return false;
  } catch (error) {
    console.error('שגיאה בבדיקת הרשאות מנהל:', error);
    return false;
  }
}; 