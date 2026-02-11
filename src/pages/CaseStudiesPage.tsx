import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, Clock, DollarSign, Target, Star, CheckCircle2, X, ChevronLeft, ChevronRight, Shield, Users, Crown, Medal, Award } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { topPerformers, formatPayout, getTotalCommunityPayouts } from '@/data/topPerformers';

// Import screenshots
import screenshot1 from '@/assets/1.png';
import screenshot2 from '@/assets/2.png';
import screenshot3 from '@/assets/3.png';
import screenshot4 from '@/assets/4.png';
import screenshot5 from '@/assets/5.png';
import screenshot6 from '@/assets/6.png';
import screenshot7 from '@/assets/7.png';
import screenshot8 from '@/assets/8.png';
import screenshot9 from '@/assets/9.png';
import screenshot10 from '@/assets/10.png';
import screenshot11 from '@/assets/11.png';
import screenshot12 from '@/assets/12.png';
import screenshot13 from '@/assets/13.png';
import screenshot14 from '@/assets/14.png';
import screenshot15 from '@/assets/15.png';
import screenshot16 from '@/assets/16.png';

const screenshots = [
  screenshot1, screenshot2, screenshot3, screenshot4, screenshot5,
  screenshot6, screenshot7, screenshot8, screenshot9, screenshot10,
  screenshot11, screenshot12, screenshot13, screenshot14, screenshot15,
  screenshot16,
];

// Static case studies data - Matching the verified payout screenshots
const caseStudies = [
  {
    id: '1',
    name: 'Ravi Kumar',
    location: 'Mumbai, India',
    propFirm: 'E8 Markets',
    accountSize: '$100K',
    timeToPas: '11 days',
    profit: '+$3,305',
    quote: 'Third attempt at a prop challenge and finally cracked it. The risk management tools made all the difference - stopped me from revenge trading when I was down. E8 payout came through in like 2 days.',
    verified: true,
  },
  {
    id: '2',
    name: 'James Miller',
    location: 'Dallas, USA',
    propFirm: 'Blueberry Funded',
    accountSize: '$100K',
    timeToPas: '9 days',
    profit: '+$5,120',
    quote: 'Was skeptical at first ngl. Tried so many signal services before and they were all trash. This one actually explains the reasoning behind each setup. Passed my challenge and got my first payout last week.',
    verified: true,
  },
  {
    id: '3',
    name: 'Lisa Brown',
    location: 'Toronto, Canada',
    propFirm: 'Funded Trading Plus',
    accountSize: '$200K',
    timeToPas: '14 days',
    profit: '+$7,850.25',
    quote: 'Quit my accounting job 6 months ago to trade full time. Everyone thought I was nuts. Just got my biggest payout yet. Whos laughing now lol',
    verified: true,
  },
  {
    id: '4',
    name: 'John Park',
    location: 'Seoul, South Korea',
    propFirm: 'Funded Trader Markets',
    accountSize: '$100K',
    timeToPas: '8 days',
    profit: '+$3,600.50',
    quote: 'The Asian session coverage is actually good which is rare. Most services only focus on London/NY. Processing time was insanely fast too - 7 minutes to get my withdrawal.',
    verified: true,
  },
  {
    id: '5',
    name: 'Michael Davis',
    location: 'Chicago, USA',
    propFirm: 'Blueberry Funded',
    accountSize: '$200K',
    timeToPas: '12 days',
    profit: '+$7,500',
    quote: 'Been trading futures for 3 years but kept blowing challenges. The position sizing calculator alone saved me from so many stupid mistakes. Finally consistent.',
    verified: true,
  },
  {
    id: '6',
    name: 'Sarah Jones',
    location: 'London, UK',
    propFirm: 'Funded Trading Plus',
    accountSize: '$200K',
    timeToPas: '10 days',
    profit: '+$9,950.50',
    quote: 'Almost 10k in one payout. Still feels surreal tbh. Failed 5 challenges before finding TraderEdge. The difference was learning to actually wait for the right setups instead of forcing trades.',
    verified: true,
  },
  {
    id: '7',
    name: 'David Kim',
    location: 'Los Angeles, USA',
    propFirm: 'Funded Trader Markets',
    accountSize: '$200K',
    timeToPas: '15 days',
    profit: '+$12,000',
    quote: 'Twelve thousand dollars. From my laptop. While working my day job. My coworkers have no idea I made more from trading this month than my salary. Wild times.',
    verified: true,
  },
  {
    id: '8',
    name: 'Wei Chen',
    location: 'Singapore',
    propFirm: 'Blueberry Funded',
    accountSize: '$100K',
    timeToPas: '13 days',
    profit: '+$3,850.25',
    quote: 'Finally a service that works for Singapore timezone. Used to wake up at 3am for signals. Now I trade during my lunch break and after work. Life changing honestly.',
    verified: true,
  },
  {
    id: '9',
    name: 'Omar Al-Fayed',
    location: 'Dubai, UAE',
    propFirm: 'Funded Trading Plus',
    accountSize: '$150K',
    timeToPas: '11 days',
    profit: '+$6,210.75',
    quote: 'Dubai is full of fake gurus flexing rented lambos. I just wanted something that actually works. No flexing, just consistent payouts every month. This is it.',
    verified: true,
  },
  {
    id: '10',
    name: 'Mateo Cruz',
    location: 'Mexico City, Mexico',
    propFirm: 'Funded Trader Markets',
    accountSize: '$100K',
    timeToPas: '9 days',
    profit: '+$4,990.50',
    quote: 'Earning in USD while living in Mexico is basically a cheat code. My cost of living is low and my income keeps growing. Best decision I ever made learning to trade.',
    verified: true,
  },
  {
    id: '11',
    name: 'Kenji Tanaka',
    location: 'Tokyo, Japan',
    propFirm: 'Blueberry Funded',
    accountSize: '$50K',
    timeToPas: '7 days',
    profit: '+$2,409.60',
    quote: 'Started with a smaller account to test things out. Passed in a week. Now scaling up to 200k. The Tokyo session setups are surprisingly good.',
    verified: true,
  },
  {
    id: '12',
    name: 'Anya Petrova',
    location: 'Berlin, Germany',
    propFirm: 'Funded Trading Plus',
    accountSize: '$100K',
    timeToPas: '12 days',
    profit: '+$5,143.50',
    quote: 'Moved from Moscow to Berlin last year. Trading gave me location independence when I needed it most. Dont have to rely on anyone or any country for income.',
    verified: true,
  },
  {
    id: '13',
    name: 'Mateo Cruz',
    location: 'Mexico City, Mexico',
    propFirm: 'Funded Trader Markets',
    accountSize: '$100K',
    timeToPas: '10 days',
    profit: '+$2,715.20',
    quote: 'Second payout this month. Consistency is everything. Not chasing home runs anymore, just taking the setups as they come. Boring but profitable.',
    verified: true,
  },
  {
    id: '14',
    name: 'Ngozi Okafor',
    location: 'Lagos, Nigeria',
    propFirm: 'FundedHive',
    accountSize: '$100K',
    timeToPas: '16 days',
    profit: '+$1,000',
    quote: 'First payout ever from trading. Its not huge but its REAL. Everyone here thinks forex is a scam because of all the ponzi schemes. This proved them wrong.',
    verified: true,
  },
  {
    id: '15',
    name: 'Arjun Patel',
    location: 'Bangalore, India',
    propFirm: 'Blueberry Funded',
    accountSize: '$50K',
    timeToPas: '8 days',
    profit: '+$2,409.60',
    quote: 'Software engineer by day, trader by night. The automated risk calculations appeal to my engineering brain. No emotions, just math. Thats how I like it.',
    verified: true,
  },
  {
    id: '16',
    name: 'Ravi Kumar',
    location: 'Mumbai, India',
    propFirm: 'Blueberry Funded',
    accountSize: '$50K',
    timeToPas: '9 days',
    profit: '+$2,409.60',
    quote: 'Second funded account now. Running E8 and Blueberry at the same time. Same signals, double the payouts. Working smarter not harder.',
    verified: true,
  },
  // Additional success stories from our community
  {
    id: '17',
    name: 'Michael R.',
    location: 'Chicago, USA',
    propFirm: 'Topstep',
    accountSize: '$150K',
    timeToPas: '8 days',
    profit: '+$12,400',
    quote: 'Honestly thought I was gonna fail again. 3rd attempt at Topstep and this time something clicked. The signals just... made sense? Idk how to explain it but Im finally funded lol',
    verified: true,
  },
  {
    id: '18',
    name: 'Jessica Williams',
    location: 'Austin, USA',
    propFirm: 'Apex Trader Funding',
    accountSize: '$100K',
    timeToPas: '11 days',
    profit: '+$9,200',
    quote: 'Was a nurse for 12 years. Burned out. Started learning trading during covid and failed SO many challenges. This is the first thing that actually worked for me.',
    verified: true,
  },
  {
    id: '19',
    name: 'Raj Patel',
    location: 'Toronto, Canada',
    propFirm: 'FundedNext',
    accountSize: '$200K',
    timeToPas: '14 days',
    profit: '+$18,600',
    quote: 'Moved to Canada 5 years ago with $2000. Everyone said trading was gambling. Now I manage more than my old engineering salary. Wild.',
    verified: true,
  },
  {
    id: '20',
    name: 'Carlos Mendez',
    location: 'Mexico City, Mexico',
    propFirm: 'FTMO',
    accountSize: '$100K',
    timeToPas: '9 days',
    profit: '+$7,890',
    quote: 'Bro the timezone thing is real. Most signals come at 3am for me usually. These actually work with NY session from here. Game changer.',
    verified: true,
  },
  {
    id: '21',
    name: 'Sarah K.',
    location: 'London, UK',
    propFirm: 'FTMO',
    accountSize: '$200K',
    timeToPas: '12 days',
    profit: '+$16,400',
    quote: 'Failed 4 challenges before this. FOUR. Spent like £2000 on reset fees. Turns out I was overtrading like crazy. The system literally stopped me from being stupid.',
    verified: true,
  },
  {
    id: '22',
    name: 'Thomas Mueller',
    location: 'Berlin, Germany',
    propFirm: 'Funded Trading Plus',
    accountSize: '$200K',
    timeToPas: '15 days',
    profit: '+$14,200',
    quote: 'Im an engineer so I was skeptical of the "AI" marketing. But the risk calculations are actually solid. Not magic, just good math. Thats all I needed.',
    verified: true,
  },
  {
    id: '23',
    name: 'Pierre Dubois',
    location: 'Paris, France',
    propFirm: 'E8 Markets',
    accountSize: '$100K',
    timeToPas: '14 days',
    profit: '+$8,800',
    quote: 'Tried maybe 6-7 signal services before. All garbage. This one actually explains WHY you should take the trade. That was the missing piece for me.',
    verified: true,
  },
  {
    id: '24',
    name: 'Emma van der Berg',
    location: 'Amsterdam, Netherlands',
    propFirm: 'FundedNext',
    accountSize: '$100K',
    timeToPas: '10 days',
    profit: '+$9,200',
    quote: 'No BS, no hype, just tells you what to do and when. I was tired of services that send 50 signals a day. Quality > quantity finally.',
    verified: true,
  },
  {
    id: '25',
    name: 'Marcus Johansson',
    location: 'Stockholm, Sweden',
    propFirm: 'FTMO',
    accountSize: '$100K',
    timeToPas: '13 days',
    profit: '+$7,750',
    quote: 'My girlfriend thought I was wasting money on another trading thing. Showed her the funded account email. She doesnt complain anymore haha',
    verified: true,
  },
  {
    id: '26',
    name: 'Sofia Rodriguez',
    location: 'Barcelona, Spain',
    propFirm: 'Funded Trading Plus',
    accountSize: '$150K',
    timeToPas: '11 days',
    profit: '+$12,600',
    quote: 'Running a small business + trading was impossible before. Now I check signals during lunch, take maybe 1-2 trades. Thats it. Works for my life.',
    verified: true,
  },
  {
    id: '27',
    name: 'Liam OConnor',
    location: 'Dublin, Ireland',
    propFirm: 'Topstep',
    accountSize: '$150K',
    timeToPas: '7 days',
    profit: '+$11,400',
    quote: '7 days mate. SEVEN. I spent 8 months trying to pass before this. Actually mental how fast it happened once I stopped doing my own analysis.',
    verified: true,
  },
  {
    id: '28',
    name: 'Anna Kowalski',
    location: 'Warsaw, Poland',
    propFirm: 'FundedNext',
    accountSize: '$50K',
    timeToPas: '8 days',
    profit: '+$4,100',
    quote: 'Started with small account because I couldnt afford to lose more money. Passed first try. Now saving up for the 100k challenge.',
    verified: true,
  },
  {
    id: '29',
    name: 'Isabella Costa',
    location: 'Lisbon, Portugal',
    propFirm: 'E8 Markets',
    accountSize: '$50K',
    timeToPas: '11 days',
    profit: '+$4,200',
    quote: 'Quit my marketing job last month. Everyone thinks Im crazy. But the funded payouts are already more than my old salary so... whos crazy now?',
    verified: true,
  },
  {
    id: '30',
    name: 'Aleksandr Petrov',
    location: 'Tallinn, Estonia',
    propFirm: 'FTMO',
    accountSize: '$100K',
    timeToPas: '9 days',
    profit: '+$8,300',
    quote: 'Small country, big dreams lol. Never thought Id be trading for a living from Estonia but here we are. Internet doesnt care where you live.',
    verified: true,
  },
  {
    id: '31',
    name: 'Hiroshi Tanaka',
    location: 'Tokyo, Japan',
    propFirm: 'FTMO',
    accountSize: '$200K',
    timeToPas: '6 days',
    profit: '+$15,600',
    quote: 'I trade the Tokyo/London overlap. The setups during that window are very clean. 6 days to pass - my wife didnt believe me until I showed her the certificate.',
    verified: true,
  },
  {
    id: '32',
    name: 'Priya Sharma',
    location: 'Mumbai, India',
    propFirm: 'E8 Markets',
    accountSize: '$100K',
    timeToPas: '12 days',
    profit: '+$7,650',
    quote: 'The drawdown calculator saved me so many times. I used to do mental math and always mess it up. Now its automatic. Small thing but huge difference.',
    verified: true,
  },
  {
    id: '33',
    name: 'Kim Min-jun',
    location: 'Seoul, South Korea',
    propFirm: 'FTMO',
    accountSize: '$100K',
    timeToPas: '8 days',
    profit: '+$9,100',
    quote: 'Korean trading culture is intense. Everyone wants fast results. This delivered. 8 days and done. My trading group couldnt believe it.',
    verified: true,
  },
  {
    id: '34',
    name: 'Nguyen Van Minh',
    location: 'Ho Chi Minh City, Vietnam',
    propFirm: 'FundedNext',
    accountSize: '$50K',
    timeToPas: '14 days',
    profit: '+$4,200',
    quote: 'Started trading during my lunch breaks at work. Now the trading income is 3x my salary. Giving my notice next month. Scary but exciting.',
    verified: true,
  },
  {
    id: '35',
    name: 'Ahmed Al-Rashid',
    location: 'Dubai, UAE',
    propFirm: 'FTMO',
    accountSize: '$200K',
    timeToPas: '10 days',
    profit: '+$18,200',
    quote: 'Dubai has so many fake traders flexing rented cars. I just wanted real results quietly. Got funded, didnt post about it, just enjoying the payouts.',
    verified: true,
  },
  {
    id: '36',
    name: 'Fatima Al-Hassan',
    location: 'Riyadh, Saudi Arabia',
    propFirm: 'FundedNext',
    accountSize: '$100K',
    timeToPas: '11 days',
    profit: '+$9,100',
    quote: 'Not many women in trading here. Dont care. Results speak. Funded in 11 days. Now helping my sister learn too.',
    verified: true,
  },
  {
    id: '37',
    name: 'Youssef Mansour',
    location: 'Cairo, Egypt',
    propFirm: 'FundedNext',
    accountSize: '$50K',
    timeToPas: '13 days',
    profit: '+$4,100',
    quote: 'Couldnt afford the big accounts. Started with 50k challenge. Passed. Now saving profits for the 200k. Slow and steady.',
    verified: true,
  },
  {
    id: '38',
    name: 'Oluwaseun Adeyemi',
    location: 'Lagos, Nigeria',
    propFirm: 'FTMO',
    accountSize: '$50K',
    timeToPas: '15 days',
    profit: '+$4,200',
    quote: 'Internet here isnt always reliable so I was worried. But the signals come through fine and I just execute when I can. It works.',
    verified: true,
  },
  {
    id: '39',
    name: 'Aisha Okonkwo',
    location: 'Johannesburg, South Africa',
    propFirm: 'FundedNext',
    accountSize: '$100K',
    timeToPas: '12 days',
    profit: '+$8,500',
    quote: 'People here think trading is a scam because of all the forex MLM stuff. Had to hide it from family at first. Now they want me to teach them lol',
    verified: true,
  },
  {
    id: '40',
    name: 'Kwame Asante',
    location: 'Accra, Ghana',
    propFirm: 'E8 Markets',
    accountSize: '$25K',
    timeToPas: '16 days',
    profit: '+$2,100',
    quote: 'Saved for 6 months for this challenge fee. Couldnt afford to fail. Didnt fail. Best investment Ive ever made honestly.',
    verified: true,
  },
  {
    id: '41',
    name: 'Amara Diallo',
    location: 'Nairobi, Kenya',
    propFirm: 'FundedNext',
    accountSize: '$50K',
    timeToPas: '14 days',
    profit: '+$4,300',
    quote: 'London session starts at 10am for us. Perfect timing. Wake up, check signals, take trades, done by lunch. Love this lifestyle.',
    verified: true,
  },
  {
    id: '42',
    name: 'Diego Silva',
    location: 'Sao Paulo, Brazil',
    propFirm: 'FundedNext',
    accountSize: '$100K',
    timeToPas: '12 days',
    profit: '+$8,300',
    quote: 'With the Real being so weak, earning in USD changed everything for me. Same work, 5x the purchasing power. Why didnt I do this earlier??',
    verified: true,
  },
  {
    id: '43',
    name: 'Valentina Garcia',
    location: 'Buenos Aires, Argentina',
    propFirm: 'FTMO',
    accountSize: '$100K',
    timeToPas: '10 days',
    profit: '+$7,900',
    quote: 'Argentina economy is... you know. Having USD income is literally survival now. Trading went from hobby to necessity real quick.',
    verified: true,
  },
  {
    id: '44',
    name: 'Sebastian Lopez',
    location: 'Bogota, Colombia',
    propFirm: 'E8 Markets',
    accountSize: '$50K',
    timeToPas: '13 days',
    profit: '+$4,100',
    quote: 'Trade from my fincas wifi while drinking coffee. This is not what I imagined trading would be like but Im not complaining at all.',
    verified: true,
  },
  {
    id: '45',
    name: 'Camila Fernandez',
    location: 'Santiago, Chile',
    propFirm: 'Funded Trading Plus',
    accountSize: '$100K',
    timeToPas: '11 days',
    profit: '+$8,200',
    quote: 'NY session starts at 10am here which is perfect. Do my analysis in the morning, trade until 2pm, rest of day is free. Best job ever.',
    verified: true,
  },
  {
    id: '46',
    name: 'Lucas Martin',
    location: 'Sydney, Australia',
    propFirm: 'FTMO',
    accountSize: '$200K',
    timeToPas: '9 days',
    profit: '+$14,900',
    quote: 'Asian session from Australia is actually prime time. 9am-2pm, markets moving, signals firing. Then I go surfing. Life is good mate.',
    verified: true,
  },
  {
    id: '47',
    name: 'Emily Watson',
    location: 'Melbourne, Australia',
    propFirm: 'FundedNext',
    accountSize: '$100K',
    timeToPas: '11 days',
    profit: '+$8,400',
    quote: 'Was a barista for 5 years. Now I trade from home in my pjs and make more in a week than I did in a month. Still cant believe this is real.',
    verified: true,
  },
  {
    id: '48',
    name: 'James Cooper',
    location: 'Auckland, New Zealand',
    propFirm: 'Apex Trader Funding',
    accountSize: '$100K',
    timeToPas: '10 days',
    profit: '+$9,100',
    quote: 'Kiwi trading at midnight because thats when US markets open. Worth it. The futures signals are spot on. Sleep schedule is wrecked but bank account is healthy.',
    verified: true,
  },
  {
    id: '49',
    name: 'Viktor Novak',
    location: 'Prague, Czech Republic',
    propFirm: 'FTMO',
    accountSize: '$100K',
    timeToPas: '8 days',
    profit: '+$7,800',
    quote: 'FTMO headquarters is literally 20 min from my flat lol. Wanted to pass their challenge so bad. Finally did it. Might go visit their office to say thanks.',
    verified: true,
  },
  {
    id: '50',
    name: 'Anastasia Volkov',
    location: 'Kyiv, Ukraine',
    propFirm: 'FundedNext',
    accountSize: '$50K',
    timeToPas: '12 days',
    profit: '+$4,200',
    quote: 'Trading from Ukraine right now... its complicated. But this gives me income and independence no matter what happens. Thats priceless.',
    verified: true,
  },
  {
    id: '51',
    name: 'Maria Santos',
    location: 'Manila, Philippines',
    propFirm: 'FundedNext',
    accountSize: '$50K',
    timeToPas: '15 days',
    profit: '+$4,100',
    quote: 'Worked in Saudi as OFW for 8 years. Missed my kids growing up. Now I trade from home and see them every day. Crying as I type this honestly.',
    verified: true,
  },
  {
    id: '52',
    name: 'Hassan Ahmed',
    location: 'Karachi, Pakistan',
    propFirm: 'FTMO',
    accountSize: '$100K',
    timeToPas: '13 days',
    profit: '+$7,600',
    quote: 'People said you cant make it in trading from Pakistan. Too many scams, bad internet, whatever excuse. Just passed FTMO. Excuses are excuses.',
    verified: true,
  },
];

const stats = [
  { label: 'Success Stories', value: '52' },
  { label: 'Total Paid Out', value: '$400K+' },
  { label: 'Countries', value: '30+' },
  { label: 'Avg Pass Time', value: '11 days' },
];

const CaseStudiesPage = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);
  const nextImage = () => setSelectedImage((prev) => (prev !== null ? (prev + 1) % screenshots.length : 0));
  const prevImage = () => setSelectedImage((prev) => (prev !== null ? (prev - 1 + screenshots.length) % screenshots.length : 0));

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      {/* Hero */}
      <section className="relative pt-32 md:pt-40 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/80 mb-6">
                <Trophy className="w-3.5 h-3.5" />
                Verified Results
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Real traders,</span>
                <br />
                <span className="font-semibold italic bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">real results.</span>
              </h1>

              <p className="text-base text-white/40 max-w-md leading-relaxed font-light">
                These aren't hypotheticals. Every result below is from a real trader using TraderEdge Pro to pass their prop firm challenges.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button asChild className="rounded-full px-6 bg-amber-500 hover:bg-amber-400 text-black">
                <Link to="/submit-story">
                  <Star className="w-4 h-4 mr-2" />
                  Share Your Story
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-8 px-6 border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="text-center"
              >
                <p className="text-2xl md:text-3xl font-semibold text-amber-400">{stat.value}</p>
                <p className="text-xs text-white/40 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <main className="relative pb-20 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Top Performers Section */}
          <section className="py-16 border-b border-white/[0.06]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl md:text-3xl font-light text-white">
                  Our <span className="text-yellow-400 italic font-semibold">Top Performers</span>
                </h2>
              </div>
              <p className="text-white/40">Lifetime payouts from TraderEdge Pro members</p>
              <p className="text-sm text-amber-400/60 mt-2">
                Total Community Payouts: <span className="font-semibold text-amber-400">${getTotalCommunityPayouts().toLocaleString()}+</span>
              </p>
            </motion.div>

            {/* Top 3 Podium */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-12">
              {/* 2nd Place */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="w-full md:w-64 order-2 md:order-1"
              >
                <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-gray-500/10 to-transparent border border-gray-500/20">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white">
                    {topPerformers[1]?.name.charAt(0)}
                  </div>
                  <Medal className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <h3 className="font-semibold text-white">{topPerformers[1]?.name}</h3>
                  <p className="text-xs text-white/40 mb-2">{topPerformers[1]?.location}</p>
                  <p className="text-2xl font-bold text-gray-300">{formatPayout(topPerformers[1]?.lifetimePayout || 0)}</p>
                  <p className="text-xs text-white/40">Lifetime Payout</p>
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-center gap-4 text-xs">
                    <span className="text-emerald-400">{topPerformers[1]?.winRate}% WR</span>
                    <span className="text-white/40">{topPerformers[1]?.totalTrades} trades</span>
                  </div>
                </div>
                <div className="h-24 bg-gradient-to-t from-gray-500/20 to-gray-500/5 rounded-b-xl flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-400">2</span>
                </div>
              </motion.div>

              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="w-full md:w-72 order-1 md:order-2"
              >
                <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-yellow-500/20 to-transparent border border-yellow-500/30 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                    #1 TOP EARNER
                  </div>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 mx-auto mb-3 flex items-center justify-center text-3xl font-bold text-white mt-2">
                    {topPerformers[0]?.name.charAt(0)}
                  </div>
                  <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <h3 className="font-bold text-lg text-white">{topPerformers[0]?.name}</h3>
                  <p className="text-xs text-white/40 mb-2">{topPerformers[0]?.location}</p>
                  <p className="text-3xl font-bold text-yellow-400">{formatPayout(topPerformers[0]?.lifetimePayout || 0)}</p>
                  <p className="text-xs text-white/40">Lifetime Payout</p>
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-center gap-4 text-xs">
                    <span className="text-emerald-400">{topPerformers[0]?.winRate}% WR</span>
                    <span className="text-white/40">{topPerformers[0]?.totalTrades} trades</span>
                  </div>
                </div>
                <div className="h-32 bg-gradient-to-t from-yellow-500/20 to-yellow-500/5 rounded-b-xl flex items-center justify-center">
                  <span className="text-5xl font-bold text-yellow-400">1</span>
                </div>
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="w-full md:w-64 order-3"
              >
                <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-amber-700/10 to-transparent border border-amber-700/20">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white">
                    {topPerformers[2]?.name.charAt(0)}
                  </div>
                  <Medal className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-white">{topPerformers[2]?.name}</h3>
                  <p className="text-xs text-white/40 mb-2">{topPerformers[2]?.location}</p>
                  <p className="text-2xl font-bold text-amber-600">{formatPayout(topPerformers[2]?.lifetimePayout || 0)}</p>
                  <p className="text-xs text-white/40">Lifetime Payout</p>
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-center gap-4 text-xs">
                    <span className="text-emerald-400">{topPerformers[2]?.winRate}% WR</span>
                    <span className="text-white/40">{topPerformers[2]?.totalTrades} trades</span>
                  </div>
                </div>
                <div className="h-16 bg-gradient-to-t from-amber-700/20 to-amber-700/5 rounded-b-xl flex items-center justify-center">
                  <span className="text-3xl font-bold text-amber-600">3</span>
                </div>
              </motion.div>
            </div>

            {/* Rest of Top Performers (4-8) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {topPerformers.slice(3, 8).map((performer, index) => (
                <motion.div
                  key={performer.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
                      {performer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{performer.name}</span>
                        <span className="text-xs text-white/30">#{index + 4}</span>
                      </div>
                      <p className="text-xs text-white/40">{performer.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-purple-400">{formatPayout(performer.lifetimePayout)}</p>
                      <p className="text-[10px] text-white/30">Lifetime Payout</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-emerald-400">{performer.winRate}%</p>
                      <p className="text-[10px] text-white/30">Win Rate</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Case Studies */}
          <section className="py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <h2 className="text-2xl md:text-3xl font-light text-white mb-2">
                Trader <span className="text-amber-400 italic">Success Stories</span>
              </h2>
              <p className="text-white/40">Verified accounts from our community</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {caseStudies.map((study, index) => (
                <motion.div
                  key={study.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.3, delay: (index % 3) * 0.05 }}
                  className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/20 transition-all duration-300"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-semibold">
                        {study.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{study.name}</span>
                          {study.verified && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <p className="text-xs text-white/40">{study.location}</p>
                        <p className="text-xs text-amber-400/60">{study.propFirm}</p>
                      </div>
                    </div>
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                      {study.accountSize}
                    </Badge>
                  </div>

                  {/* Quote */}
                  <p className="text-sm text-white/60 mb-4 leading-relaxed">"{study.quote}"</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white/30" />
                      <span className="text-xs text-white/50">{study.timeToPas}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">{study.profit}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Screenshot Gallery */}
          <section className="py-16 border-t border-white/[0.06]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h2 className="text-2xl md:text-3xl font-light text-white">
                  Verified <span className="text-amber-400 italic">Trade Results</span>
                </h2>
              </div>
              <p className="text-white/40">
                Real screenshots from our traders. Click to enlarge.
              </p>
            </motion.div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {screenshots.map((src, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => openLightbox(index)}
                  className="aspect-video rounded-lg overflow-hidden cursor-pointer group relative bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/30 transition-all duration-300"
                >
                  <img
                    src={src}
                    alt={`Trade result ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium transition-opacity">
                      View
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Results count */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-white/30">
                Showing {screenshots.length} verified results from our trading community
              </p>
            </motion.div>
          </section>

          {/* CTA */}
          <section className="py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 text-center"
            >
              <Users className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
                Ready to be our next success story?
              </h2>
              <p className="text-white/40 max-w-md mx-auto mb-6">
                Join hundreds of traders who have passed their prop firm challenges with TraderEdge Pro.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="rounded-full bg-amber-500 hover:bg-amber-400 text-black">
                  <Link to="/membership">
                    Start Your Journey
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-white/20 text-white hover:bg-white/5">
                  <Link to="/submit-story">
                    Submit Your Story
                  </Link>
                </Button>
              </div>
            </motion.div>
          </section>

        </div>
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Navigation */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            {/* Image */}
            <motion.img
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={screenshots[selectedImage]}
              alt={`Trade result ${selectedImage + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
              {selectedImage + 1} / {screenshots.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default CaseStudiesPage;
