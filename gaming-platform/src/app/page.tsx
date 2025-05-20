import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center w-full">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            GameChallenger
          </div>
          <div className="flex flex-col min-[400px]:flex-row min-[400px]:space-x-2 sm:space-x-4 space-y-2 min-[400px]:space-y-0 items-center">
            <Link href="/login">
              <button className="px-3 sm:px-4 py-2 text-pink-500 hover:text-pink-400 text-base sm:text-lg">Login</button>
            </Link>
            <Link href="/signup">
              <button className="px-3 sm:px-4 py-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700 text-base sm:text-lg">Sign Up</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Compete. Win. <span className="text-pink-500">Earn.</span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl">
            Join GameChallenger where skill meets reward. Create matches, challenge players, and win real prizes in your favorite games.
          </p>
          <div className="flex flex-col min-[400px]:flex-row min-[400px]:space-x-4 space-y-4 min-[400px]:space-y-0 items-center justify-center">
            <Link href="/signup">
              <button className="px-8 py-4 bg-purple-600 rounded-lg text-lg font-semibold text-white hover:bg-purple-700 transition-colors duration-200">
                Get Started
              </button>
            </Link>
            <button className="px-8 py-4 border border-pink-500 rounded-lg text-lg font-semibold hover:bg-pink-500/10">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section with animated background glow */}
      <section className="relative container mx-auto px-6 py-20 overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="w-[80vw] h-[40vw] max-w-5xl blur-3xl opacity-40 animate-glow bg-gradient-to-br from-pink-500 via-purple-600 to-pink-500 rounded-full" />
        </div>
        <h2 className="text-3xl font-bold text-center mb-16">Why Choose GameChallenger?</h2>
        <div className="grid md:grid-cols-3 gap-12">
          {/* Feature Card 1 */}
          <div className="group relative rounded-xl animated-gradient-border">
            <div className="bg-black rounded-xl h-full p-8 flex flex-col transition-shadow duration-300 group-hover:shadow-[0_0_32px_8px_rgba(236,72,153,0.35)]">
              <div className="text-4xl mb-4 flex justify-start">
                <span className="text-pink-400 animate-pulse-slow">🎮</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-pink-400">Multiple Games</h3>
              <p className="text-gray-300">
                From Call of Duty to FIFA, choose from a wide range of popular games to compete in.
              </p>
            </div>
          </div>
          {/* Feature Card 2 */}
          <div className="group relative rounded-xl animated-gradient-border">
            <div className="bg-black rounded-xl h-full p-8 flex flex-col transition-shadow duration-300 group-hover:shadow-[0_0_32px_8px_rgba(236,72,153,0.35)]">
              <div className="text-4xl mb-4 flex justify-start">
                <span className="text-pink-400 animate-pulse-slow">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-pink-400">Win Real Prizes</h3>
              <p className="text-gray-300">
                Turn your gaming skills into real rewards with our secure payment system.
              </p>
            </div>
          </div>
          {/* Feature Card 3 */}
          <div className="group relative rounded-xl animated-gradient-border">
            <div className="bg-black rounded-xl h-full p-8 flex flex-col transition-shadow duration-300 group-hover:shadow-[0_0_32px_8px_rgba(236,72,153,0.35)]">
              <div className="text-4xl mb-4 flex justify-start">
                <span className="text-pink-400 animate-pulse-slow">👥</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-pink-400">Gaming Community</h3>
              <p className="text-gray-300">
                Connect with other players, make friends, and join exciting tournaments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-pink-500 mb-4">1</div>
            <h3 className="text-xl font-semibold mb-2">Create Account</h3>
            <p className="text-gray-300">Sign up and set up your gaming profile</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-pink-500 mb-4">2</div>
            <h3 className="text-xl font-semibold mb-2">Join Matches</h3>
            <p className="text-gray-300">Find and join matches in your favorite games</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-pink-500 mb-4">3</div>
            <h3 className="text-xl font-semibold mb-2">Compete</h3>
            <p className="text-gray-300">Play against other skilled players</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-pink-500 mb-4">4</div>
            <h3 className="text-xl font-semibold mb-2">Win Prizes</h3>
            <p className="text-gray-300">Get rewarded for your victories</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Gaming Journey?</h2>
          <p className="text-xl mb-8">Join thousands of players already competing on our platform</p>
          <Link href="/signup">
            <button className="px-8 py-4 bg-white text-purple-600 rounded-lg text-lg font-semibold hover:bg-gray-100">
              Sign Up Now
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-gray-800">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-0 text-center md:text-left">
          <div className="text-gray-400">© 2024 GameChallenger. All rights reserved.</div>
          <div className="space-x-6 flex justify-center md:justify-start">
            <a href="#" className="text-gray-400 hover:text-pink-500">Terms</a>
            <a href="#" className="text-gray-400 hover:text-pink-500">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-pink-500">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
