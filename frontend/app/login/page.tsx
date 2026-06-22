+"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { authApi } from "../lib/api";

export default function Login() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If user has token, auto redirect to dashboard
    if (localStorage.getItem("token")) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await authApi.register(email, password, fullName);
      } else {
        await authApi.login(email, password);
      }
      
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed. Check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10 bg-slate-50">
      <Card className="w-full max-w-md bg-white border-slate-200 shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-sm mb-4">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-black tracking-wide text-slate-800">
            {isRegister ? "CREATE ACCOUNT" : "WELCOME BACK"}
          </CardTitle>
          <CardDescription className="text-slate-500">
            {isRegister 
              ? "Sign up to unify your payment statements and trace savings" 
              : "Sign in to manage your financial intelligence platform"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Full Name
                </label>
                <Input
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="demo@finsight.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full h-11" loading={loading}>
              {isRegister ? "Register" : "Sign In"}
            </Button>
          </form>

          {/* Seeding Demo Help Box */}
          {!isRegister && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-xs flex gap-2.5">
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
              <div>
                <span className="font-bold text-blue-900">Demo Login Credentials:</span>
                <p className="mt-0.5 font-mono text-blue-800">Email: demo@finsight.ai</p>
                <p className="font-mono text-blue-800">Password: password123</p>
              </div>
            </div>
          )}

          {/* Toggle Login/Registration link */}
          <div className="text-center text-xs text-muted-foreground">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              suppressHydrationWarning={true}
              className="text-primary font-bold hover:underline"
            >
              {isRegister ? "Sign In" : "Register here"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
