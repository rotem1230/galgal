// בדיקה אם המייל הוא של מנהל ידוע מערכת (הרשאה קבועה בקוד)
if (email === 'rotemhaha321@gmail.com' || email === 'kfirgal505@gmail.com') {
  console.log("זוהה משתמש מנהל קבוע במערכת:", email);
  return true;
} 