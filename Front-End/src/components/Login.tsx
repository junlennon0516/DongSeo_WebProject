import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("아이디와 비밀번호를 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success("로그인되었습니다.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "로그인에 실패했습니다.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF8DE] via-[#FFF2C6] to-[#FFF8DE] px-4">
      <div className="w-full max-w-sm space-y-8 rounded-2xl bg-white/90 backdrop-blur-xl p-8 shadow-2xl shadow-[#8CA9FF]/10 border border-[#AAC4F5]/20">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#8CA9FF] via-[#AAC4F5] to-[#8CA9FF] text-white font-bold text-xl shadow-lg shadow-[#8CA9FF]/30">
            동서
          </div>
          <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
          <p className="mt-1 text-sm text-gray-600">계정은 관리자가 생성·부여합니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-700">아이디</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디"
              autoComplete="username"
              disabled={loading}
              className="bg-[#FFF8DE] border-[#AAC4F5] focus-visible:ring-[#8CA9FF] focus-visible:border-[#8CA9FF]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoComplete="current-password"
              disabled={loading}
              className="bg-[#FFF8DE] border-[#AAC4F5] focus-visible:ring-[#8CA9FF] focus-visible:border-[#8CA9FF]"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#8CA9FF] to-[#AAC4F5] hover:from-[#7A99FF] hover:to-[#9AB4E5] text-white shadow-lg shadow-[#8CA9FF]/30"
            disabled={loading}
          >
            {loading ? "로그인 중…" : "로그인"}
          </Button>
        </form>
      </div>
    </div>
  );
}
