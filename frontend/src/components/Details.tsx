import { 
  Database, 
  GitBranch, 
  Award, 
  ShoppingBag 
} from 'lucide-react'

interface CompanyCardProps {
  name: string
  color: string
  icon: React.ReactNode
  description: string
}

const CompanyCard = ({ name, color, icon, description }: CompanyCardProps) => {
  return (
    <div className={`rounded-lg p-6 flex flex-col items-center ${color}`}>
      <div className="bg-black rounded-lg p-3 mb-4">
        {icon}
      </div>
      <h3 className="font-medium text-lg mb-2">{name}</h3>
      <p className="text-center text-sm text-gray-700">{description}</p>
    </div>
  )
}

export default function Details() {
  const features = [
    {
      name: "Decentralised Storage",
      color: "bg-pink-100",
      icon: <Database className="h-6 w-6 text-white" />,
      description: "Store your AI model securely across a distributed network with no single point of failure."
    },
    {
      name: "Version Control",
      color: "bg-purple-100",
      icon: <GitBranch className="h-6 w-6 text-white" />,
      description: "Track changes, maintain history, and collaborate seamlessly with advanced versioning."
    },
    {
      name: "Rewards",
      color: "bg-green-100",
      icon: <Award className="h-6 w-6 text-white" />,
      description: "Earn tokens and incentives for contributing to the network and participating in the ecosystem."
    },
    {
      name: "Marketplace",
      color: "bg-yellow-100",
      icon: <ShoppingBag className="h-6 w-6 text-white" />,
      description: "Buy, sell, and trade AI models in our secure peer-to-peer marketplace."
    }
  ]

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-10">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <CompanyCard
              key={index}
              name={feature.name}
              color={feature.color}
              icon={feature.icon}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}