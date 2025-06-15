// בדיקה אם המשתמש הוא מנהל
if (currentUser.email === 'rotemhaha321@gmail.com' || currentUser.email === 'kfirgal505@gmail.com') {
  console.log(`זיהינו את המשתמש המיוחד ${currentUser.email} - מאפשר גישה`);
  return children;
} 