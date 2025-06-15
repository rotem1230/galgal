const checkIfUserIsAdmin = async (email) => {
  try {
    if (email === 'rotemhaha321@gmail.com' || email === 'kfirgal505@gmail.com') {
      console.log(`משתמש ${email} זוהה כמנהל`);
      return true;
    }
    console.log(`משתמש ${email} אינו מנהל`);
    return false;
  } catch (error) {
    console.error('שגיאה בבדיקת הרשאות מנהל:', error);
    return false;
  }
}; 