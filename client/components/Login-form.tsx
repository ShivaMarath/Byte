"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "./ui/card"
import { authClient } from "@/lib/auth-client"
import { GithubIcon } from 'lucide-react';

const LoginForm = () => {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login-img.jpg')" }}
    >
      <div className="text-center px-10">
        <h1 className="text-6xl font-bold text-white drop-shadow-md">
          Welcome back! to Byte-cli
        </h1>
      </div>

      <Card className="w-full max-w-sm border-2 border-dashed rounded-xl">
        <CardContent className="p-6">
          <Button
            variant="outline"
            className="w-full flex items-center gap-2"
            type="button"
            onClick={() =>
              authClient.signIn.social({
                provider: "github",
                callbackURL: "http://localhost:3000",
              })
            }
          >
            <GithubIcon className="w-5 h-5" />
            Continue With GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginForm