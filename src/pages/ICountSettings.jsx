import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from "@/components/ui/alert";
import { Settings, CheckCircle, AlertCircle } from "lucide-react";
import * as iCountApi from "@/api/icount";

export default function ICountSettings() {
  const [config, setConfig] = useState({
    companyId: "",
    username: "",
    userApiToken: "",
    apiEndpoint: "https://api.icount.co.il/api/v3.0"
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // טעינת הגדרות קיימות
  useEffect(() => {
    const loadConfig = () => {
      const result = iCountApi.loadIcountConfig();
      if (result) {
        // קריאה לגרסה המיוצאת של הקונפיגורציה
        const currentConfig = iCountApi.default;
        setConfig({
          companyId: currentConfig.companyId || "",
          username: currentConfig.username || "",
          userApiToken: currentConfig.userApiToken || "",
          apiEndpoint: currentConfig.apiEndpoint || "https://api.icount.co.il/api/v3.0"
        });
      }
    };

    loadConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // שמירת הקונפיגורציה
      iCountApi.setIcountConfig(config);
      
      // בדיקת החיבור
      await testConnection();
      
      alert("הגדרות נשמרו בהצלחה!");
    } catch (error) {
      console.error("שגיאה בשמירת הגדרות:", error);
      alert(`שגיאה בשמירת הגדרות: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const isConnected = await iCountApi.testIcountConnection();
      setTestResult({
        success: isConnected,
        message: isConnected 
          ? "החיבור ל-iCount נבדק בהצלחה!" 
          : "החיבור ל-iCount נכשל. אנא ודא שהפרטים נכונים."
      });
    } catch (error) {
      console.error("שגיאה בבדיקת חיבור:", error);
      setTestResult({
        success: false,
        message: `שגיאה בבדיקת חיבור: ${error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-6 h-6 ml-2" />
            הגדרות חיבור ל-iCount
          </CardTitle>
          <CardDescription>
            הגדר את פרטי החיבור ל-API של iCount להפקת חשבוניות אוטומטית
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {testResult && (
              <Alert variant={testResult.success ? "success" : "destructive"}>
                {testResult.success 
                  ? <CheckCircle className="h-4 w-4" /> 
                  : <AlertCircle className="h-4 w-4" />
                }
                <AlertTitle>
                  {testResult.success ? "החיבור תקין" : "שגיאת חיבור"}
                </AlertTitle>
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
            
            <div>
              <label htmlFor="companyId" className="block text-sm font-medium mb-1">
                מזהה חברה ב-iCount
              </label>
              <Input
                id="companyId"
                name="companyId"
                value={config.companyId}
                onChange={handleChange}
                placeholder="הכנס את מזהה החברה שלך"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                ניתן למצוא בהגדרות החשבון ב-iCount
              </p>
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                שם משתמש ב-iCount
              </label>
              <Input
                id="username"
                name="username"
                value={config.username}
                onChange={handleChange}
                placeholder="הכנס את שם המשתמש שלך"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                שם המשתמש שאיתו אתה מתחבר ל-iCount
              </p>
            </div>
            
            <div>
              <label htmlFor="userApiToken" className="block text-sm font-medium mb-1">
                מפתח API
              </label>
              <Input
                id="userApiToken"
                name="userApiToken"
                value={config.userApiToken}
                onChange={handleChange}
                placeholder="הכנס את מפתח ה-API"
                type="password"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                ניתן לייצר בהגדרות החשבון ב-iCount תחת מפתחות API
              </p>
            </div>
            
            <div>
              <label htmlFor="apiEndpoint" className="block text-sm font-medium mb-1">
                כתובת שרת ה-API
              </label>
              <Input
                id="apiEndpoint"
                name="apiEndpoint"
                value={config.apiEndpoint}
                onChange={handleChange}
                placeholder="https://api.icount.co.il/api/v3.0"
              />
              <p className="text-sm text-gray-500 mt-1">
                בדרך כלל אין צורך לשנות ערך זה
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={isTesting || !config.companyId || !config.userApiToken}
            >
              {isTesting ? "בודק חיבור..." : "בדוק חיבור"}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "שומר..." : "שמור הגדרות"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 