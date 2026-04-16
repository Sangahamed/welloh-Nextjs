import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-magenta-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
      <div className="relative card-3d bg-black/80 backdrop-blur-md p-8 rounded-3xl border border-magenta-500/20 glow-magenta">
        <SignUp />
      </div>
    </div>
  );
}
