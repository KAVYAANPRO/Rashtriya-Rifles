import { useNavigate } from 'react-router-dom'
import { CITIES, ACTIVITIES } from '../store/mockData'
import ScrollMorphHero from '../components/ui/scroll-morph-hero'
import Logo from '../components/Logo'

const STEPS = [
  { n: '01', title: 'Search & discover', desc: 'Browse curated cities and activities from Kyoto to Cape Town, filtered by cost, category and rating.' },
  { n: '02', title: 'Plan the basics', desc: 'Name your trip, pick a starting city, set your dates and total budget in one short form.' },
  { n: '03', title: 'Build the itinerary', desc: 'Add stops for each city, then drop activities into each one — the running cost updates as you go.' },
  { n: '04', title: 'Track the budget', desc: 'See spend vs. budget by category at a glance, with a clear warning if any section runs over.' },
]

const FEATURES = [
  { title: 'Live budget tracking', desc: 'Every activity you add updates your total spend immediately — no manual math, no surprises.' },
  { title: 'Day-by-day itinerary', desc: 'Switch between a day-list view and a by-city view to see your trip exactly how you want it.' },
  { title: 'Curated catalog', desc: `${ACTIVITIES.length}+ activities across ${CITIES.length} cities, each with cost, duration and rating.` },
  { title: 'Everything in one place', desc: 'Trips, stops, activities and budgets live together — no spreadsheets, no scattered notes.' },
]

const STATS = [
  { value: `${CITIES.length}`, label: 'cities to explore' },
  { value: `${ACTIVITIES.length}+`, label: 'curated activities' },
  { value: '$0', label: 'to start planning' },
]

export default function Welcome() {
  const navigate = useNavigate()

  const jumpTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      {/* Hero — exactly one viewport tall, so the whole ring is always visible */}
      <div className="relative h-[100svh]">
        <ScrollMorphHero />

        {/* Top bar sits inside the hero and scrolls away with it, rather than following the viewport */}
        <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
          <div className="max-w-[1320px] mx-auto px-4 md:px-10 h-[68px] flex items-center justify-between">
            <div className="pointer-events-auto">
              <Logo dark size={30} textSize={17} />
            </div>
            <div
              onClick={() => navigate('/login')}
              className="pointer-events-auto px-5 py-2.5 rounded-full text-white text-sm font-bold cursor-pointer transition-colors hover:brightness-110"
              style={{ background: 'var(--ac)' }}
            >
              Sign in
            </div>
          </div>
        </div>
      </div>

      {/* CTAs sit below the hero so they can never collide with the ring */}
      <div className="bg-[#0A0A0A] pb-16">
        <div className="flex gap-3 flex-wrap justify-center px-4">
          <div
            onClick={() => navigate('/register')}
            className="px-7 py-4 rounded-full text-white text-[15px] font-bold cursor-pointer transition-transform hover:-translate-y-0.5"
            style={{ background: 'var(--ac)' }}
          >
            Create an account
          </div>
          <div
            onClick={() => navigate('/login')}
            className="px-7 py-4 rounded-full border border-white/25 text-white text-[15px] font-bold cursor-pointer transition-transform hover:-translate-y-0.5"
          >
            Sign in
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4 px-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl px-6 py-4 border border-white/12 bg-white/5 text-center">
              <div className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--ac)' }}>{s.value}</div>
              <div className="text-[11px] text-white/50 font-semibold uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4 flex-wrap justify-center px-4 text-xs font-semibold text-white/45">
          <span onClick={() => jumpTo('how-it-works')} className="cursor-pointer hover:text-white transition-colors">How it works</span>
          <span className="text-white/20">·</span>
          <span onClick={() => jumpTo('why-us')} className="cursor-pointer hover:text-white transition-colors">Why GlobalTrotter</span>
          <span className="text-white/20">·</span>
          <span onClick={() => navigate('/register')} className="cursor-pointer hover:text-white transition-colors">Create an account</span>
        </div>
      </div>

      {/* How it works */}
      <div id="how-it-works" className="max-w-[1320px] mx-auto px-4 md:px-10 py-16 scroll-mt-20">
        <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--ac)' }}>How it works</div>
        <h2 className="text-[clamp(24px,3vw,34px)] font-extrabold tracking-tight mt-3 mb-8">From idea to itinerary in four steps</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-white border border-[#e9eaf2] rounded-3xl p-6 transition-transform hover:-translate-y-1.5 hover:shadow-lg">
              <div className="mono text-[13px] font-bold w-10 h-10 rounded-xl grid place-items-center" style={{ background: 'var(--ac-w)', color: 'var(--ac-d)' }}>{s.n}</div>
              <div className="text-[16px] font-extrabold tracking-tight mt-4">{s.title}</div>
              <p className="text-[13px] text-[#6b6c80] mt-2 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why GlobalTrotter */}
      <div id="why-us" className="bg-white border-y border-[#e9eaf2] scroll-mt-20">
        <div className="max-w-[1320px] mx-auto px-4 md:px-10 py-16">
          <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--ac)' }}>Why GlobalTrotter</div>
          <h2 className="text-[clamp(24px,3vw,34px)] font-extrabold tracking-tight mt-3 mb-8">Everything a trip needs, nothing it doesn't</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-3xl p-6 bg-[#F7F9FC] border border-[#eceef4]">
                <div className="text-[16px] font-extrabold tracking-tight">{f.title}</div>
                <p className="text-[13px] text-[#6b6c80] mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[var(--ink)]">
        <div className="max-w-[1320px] mx-auto px-4 md:px-10 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Logo size={28} textSize={16} className="mb-3" />
            <p className="text-white/50 text-sm leading-relaxed max-w-[260px]">
              Plan multi-city trips, build day-by-day itineraries and keep the whole budget in one place.
            </p>
          </div>
          <div>
            <div className="text-white text-[13px] font-bold uppercase tracking-widest mb-4">Get started</div>
            <div className="flex flex-col gap-3 text-sm text-white/60">
              <span onClick={() => navigate('/register')} className="cursor-pointer hover:text-white">Create an account</span>
              <span onClick={() => navigate('/login')} className="cursor-pointer hover:text-white">Sign in</span>
            </div>
          </div>
          <div>
            <div className="text-white text-[13px] font-bold uppercase tracking-widest mb-4">Coverage</div>
            <p className="text-sm text-white/60 leading-relaxed">{CITIES.length} cities · {ACTIVITIES.length}+ activities and counting.</p>
          </div>
          <div>
            <div className="text-white text-[13px] font-bold uppercase tracking-widest mb-4">Demo login</div>
            <p className="text-sm text-white/60 leading-relaxed mono">ananya.rao / travel2026</p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-[1320px] mx-auto px-4 md:px-10 py-5 text-white/40 text-xs">
            © {new Date().getFullYear()} GlobalTrotter. Built for travelers who plan ahead.
          </div>
        </div>
      </div>
    </div>
  )
}
