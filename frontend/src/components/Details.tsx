//TODO: change it to our own design
import { Button } from "../components/ui/button"
import { Sparkles, DogIcon as Horse, Building, SandwichIcon as Hamburger } from 'lucide-react'

interface CompanyCardProps {
  name: string
  jobs: number
  color: string
  icon: React.ReactNode
}

const CompanyCard = ({ name, jobs, color, icon }: CompanyCardProps) => {
  return (
    <div className={`rounded-lg p-6 flex flex-col items-center ${color}`}>
      <div className="bg-black rounded-lg p-3 mb-4">
        {icon}
      </div>
      <h3 className="font-medium text-lg">{name}</h3>
      <p className="text-sm mb-4">{jobs} jobs</p>
      <Button variant="outline" className="bg-transparent border-black/20 hover:bg-black/5">
        View
      </Button>
    </div>
  )
}

export default function Details() {
  const companies = [
    {
      name: "Unicorn",
      jobs: 30,
      color: "bg-pink-100",
      icon: <Sparkles className="h-6 w-6 text-white" />
    },
    {
      name: "Tech Foals",
      jobs: 28,
      color: "bg-purple-100",
      icon: <Horse className="h-6 w-6 text-white" />
    },
    {
      name: "B Bank",
      jobs: 12,
      color: "bg-green-100",
      icon: <Building className="h-6 w-6 text-white" />
    },
    {
      name: "McBurger",
      jobs: 45,
      color: "bg-yellow-100",
      icon: <Hamburger className="h-6 w-6 text-white" />
    }
  ]

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-10">Promoted companies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {companies.map((company, index) => (
            <CompanyCard
              key={index}
              name={company.name}
              jobs={company.jobs}
              color={company.color}
              icon={company.icon}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
