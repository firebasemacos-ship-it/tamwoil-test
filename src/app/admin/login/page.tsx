
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import logo from "@/app/assets/logo.png";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getManagerByUsername, ensureDefaultAdminExists } from "@/lib/actions";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const Logo = () => (
  <div className="flex items-center justify-center mb-8">
    <Image src={logo} alt="Logo" width={100} height={100} className="mx-auto" />
  </div>
);

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setLightMode } = useTheme();

  useEffect(() => {
    setLightMode();
  }, [setLightMode]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال اسم المستخدم وكلمة المرور.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      // Ensure the default admin exists before attempting to log in
      await ensureDefaultAdminExists();
      const manager = await getManagerByUsername(username);

      if (manager && manager.password === password) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك، ${manager.name}`,
        });
        localStorage.setItem('loggedInUser', JSON.stringify({ id: manager.id, type: 'admin' }));
        router.push("/admin/dashboard");
      } else {
        toast({
          title: "فشل تسجيل الدخول",
          description: "اسم المستخدم أو كلمة المرور غير صحيحة.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "خطأ في الخادم",
        description: "حدث خطأ أثناء محاولة تسجيل الدخول. الرجاء المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary p-4"
      dir="rtl"
    >
      <main className="w-full max-w-md mx-auto">
        <div className="bg-card/60 backdrop-blur-lg rounded-2xl border shadow-lg p-8 text-center">
          <Logo />

          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              لوحة تحكم المدير
            </h1>
            <p className="text-muted-foreground">سجل الدخول للمتابعة</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 mb-6 text-right">
            <Input
              dir="ltr"
              type="text"
              placeholder="اسم المستخدم"
              className="h-12 text-center bg-transparent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
            <Input
              dir="rtl"
              type="password"
              placeholder="كلمة السر"
              className="h-12 text-center bg-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <Button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-semibold rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                  <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      جاري التحقق...
                  </>
              ) : 'تسجيل الدخول'}
            </Button>
          </form>

          <div className="mt-6">
            <Link href="/" passHref>
              <Button variant="link">العودة إلى صفحة المستخدم</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
