import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";



export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900">
      <div className="bg-gradient-to-r from-cyan-700 via-sky-700 to-cyan-700 py-1.5 text-center text-sm font-medium text-cyan-50">
        Catch us on Loopx Launch Week <ArrowRight className="ml-2 inline" size={14} />
      </div>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link to="/" className="loopx-logo text-[2rem]">
            Loopx
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <a href="#features" className="transition hover:text-slate-950">Features</a>
            <a href="#how-it-works" className="transition hover:text-slate-950">How It Works</a>
            <a href="#pricing" className="transition hover:text-slate-950">Pricing</a>
            <a href="#use-cases" className="transition hover:text-slate-950">Use Cases</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/sign-in" className="text-sm font-semibold text-slate-700 transition hover:text-slate-950">
              Log in
            </Link>
            <Link to="/sign-up" className="text-sm font-semibold text-slate-700 transition hover:text-slate-950">
              Sign Up
            </Link>
            <Link
              to="/sign-up"
              className="rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-300 transition hover:brightness-105"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 pb-14 pt-12 lg:px-10">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
              <Sparkles size={14} />
              AI-Powered Outreach Platform
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-tight tracking-[-0.03em] md:text-7xl">
              Turn Cold Outreach Into
              <br />
              Predictable Revenue
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Reach your ideal customers through Email, WhatsApp, and SMS — all from one platform. Automate, personalize, and scale your outreach effortlessly.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/sign-up"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Start Free Trial
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/sign-up"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-300 transition hover:brightness-105"
              >
                Book a Demo
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-500">✦ 14-day free trial ✦ No credit card required ✦ Setup in under 5 minutes</p>
          </div>

            <div className="mx-auto mt-14 max-w-5xl rounded-[2rem] bg-gradient-to-br from-violet-500 to-purple-500 p-6 shadow-2xl">
              <div className="grid gap-4 md:grid-cols-3">
                <article className="rounded-2xl bg-white/90 p-4 shadow-md">
                  <p className="text-xs font-semibold text-slate-500">Email Open Rate</p>
                  <p className="mt-2 text-3xl font-semibold">68%</p>
                  <p className="text-xs text-emerald-600">↑ 12% this week</p>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div className="h-full w-[68%] rounded-full bg-emerald-500" />
                  </div>
                </article>
                <article className="rounded-2xl bg-white/90 p-4 shadow-md">
                  <p className="text-xs font-semibold text-slate-500">WhatsApp Reply Rate</p>
                  <p className="mt-2 text-3xl font-semibold">41%</p>
                  <p className="text-xs text-emerald-600">↑ 8% this week</p>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div className="h-full w-[41%] rounded-full bg-emerald-500" />
                  </div>
                </article>
                <article className="rounded-2xl bg-white/90 p-4 shadow-md">
                  <p className="text-xs font-semibold text-slate-500">Meetings Booked (Last 30 days)</p>
                  <p className="mt-2 text-3xl font-semibold">127</p>
                  <div className="mt-3 flex gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-8 flex-1 rounded-sm bg-emerald-100" />)}
                  </div>
                </article>
              </div>
            </div>
        </section>

        <section id="features" className="bg-[#070b14] py-20 text-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="text-center">
              <p className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                Features
              </p>
              <h2 className="mx-auto mt-4 max-w-3xl text-5xl font-semibold tracking-[-0.03em] md:text-6xl">
                Everything You Need to
                <br />
                Scale Outreach
              </h2>
            </div>

            <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {[
                  ["01", "Email Automation", "Send personalized cold emails at scale with automated follow-ups that feel human."],
                  ["02", "WhatsApp Outreach", "Engage leads on the most responsive channel with automated, compliant messaging."],
                  ["03", "SMS Campaigns", "Reach prospects instantly with high open-rate SMS campaigns that convert."],
                  ["04", "Smart Personalization", "Dynamic fields and behavior-based triggers for better conversions at every touchpoint."],
                  ["05", "Analytics Dashboard", "Track opens, clicks, replies, and conversions in real-time across all channels."],
                  ["06", "CRM Integrations", "Connect seamlessly with your existing tools — HubSpot, Salesforce, Pipedrive, and more."],
                ].map(([num, title, description]) => (
                  <article key={title} className="rounded-xl border border-white/10 p-5 bg-white/5">
                    <p className="text-xs font-semibold text-emerald-300">{num}</p>
                    <p className="text-lg font-semibold mt-2">{title}</p>
                    <p className="mt-2 text-sm text-slate-300">{description}</p>
                  </article>
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link
                  to="/sign-up"
                  className="inline-flex rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-400"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-[#046b77] py-20 text-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="text-center text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100">Pricing & Plans</p>
            <h2 className="mx-auto mt-4 max-w-4xl text-center text-5xl font-semibold tracking-[-0.03em] md:text-6xl">
              Local Businesses or
              <br />
              Enterprises, A Plan for All
            </h2>
            <p className="mt-6 text-center text-cyan-100">No long term contracts • Cancel anytime • 100% transparency</p>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {[
                { name: "Free Trial", price: "$0", description: "Perfect for testing the platform (14 days).", bullets: ["Up to 500 emails", "Email outreach only", "Basic analytics", "Limited automation"] },
                { name: "Growth Plan", price: "$19.99 / month", description: "Best for growing businesses.", bullets: ["Up to 5,000 emails/month", "WhatsApp outreach included", "Automated sequences & follow-ups", "Advanced analytics", "Standard support"] },
                { name: "Pro Plan", price: "$29.99 / month", description: "Built for serious scaling.", bullets: ["Up to 15,000 emails/month", "Email + WhatsApp + SMS", "Full automation suite", "Priority delivery optimization", "Priority support"] },
              ].map((plan) => (
                <article key={plan.name} className="rounded-3xl bg-white p-6 text-slate-900 shadow-xl">
                  <p className="text-4xl font-semibold">{plan.name}</p>
                  <p className="mt-3 text-2xl font-semibold">{plan.price}</p>
                  <p className="mt-3 text-sm text-slate-600">{plan.description}</p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-700">
                    {plan.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/sign-up"
                    className="mt-7 inline-flex w-full justify-center rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Start Free Trial
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="bg-[#070b14] py-20 text-white">
          <div className="mx-auto max-w-7xl px-6 text-center lg:px-10">
            <h2 className="text-5xl font-semibold tracking-[-0.03em] md:text-7xl">Get Visibility, Everywhere</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">Just drop your email and we will reach out.</p>
            <div className="mx-auto mt-8 flex max-w-2xl gap-3">
              <input
                type="email"
                placeholder="jane@company.com"
                className="w-full rounded-full border border-white/10 bg-white px-5 py-3 text-slate-900 outline-none"
              />
              <button className="rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-8 py-3 font-semibold text-white">Submit</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-2 lg:grid-cols-5 lg:px-10">
          <div className="lg:col-span-2">
            <p className="loopx-logo text-5xl">Loopx</p>
            <p className="mt-4 max-w-md text-slate-600">Our weekly newsletter contains insights from growth strategies we use with clients. We do not spam.</p>
            <Link to="/sign-up" className="mt-6 inline-block rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white">
              Sign Up To Our Newsletter
            </Link>
          </div>
          {[
            ["Solutions", "B2B", "SaaS", "Ecommerce", "Healthtech"],
            ["Resources", "Case Studies", "Blogs", "Testimonials", "Newsletter"],
            ["Tools", "Fast Schema Checker", "Search Insights", "Rank Tracker", "Prompt Analyzer"],
          ].map((col) => (
            <div key={col[0]}>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-900">{col[0]}</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {col.slice(1).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
