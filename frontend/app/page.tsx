import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Plateforme de Quiz Interactif
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Créez et participez à des quiz en temps réel. Une expérience
          d&apos;apprentissage interactive et engageante.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/register">
            <Button size="lg" variant="primary">
              Commencer maintenant
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Se connecter
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👨‍🏫</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Pour les Enseignants</h3>
            <p className="text-gray-600">
              Créez des quiz personnalisés avec différents types de questions et
              lancez des sessions en temps réel.
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👨‍🎓</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Pour les Étudiants</h3>
            <p className="text-gray-600">
              Rejoignez des sessions de quiz avec un code d&apos;accès et
              répondez aux questions en temps réel.
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Temps Réel</h3>
            <p className="text-gray-600">
              Synchronisation instantanée des questions, réponses et résultats
              via WebSocket.
            </p>
          </div>
        </Card>
      </div>

      {/* How it works */}
      <Card className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Comment ça fonctionne ?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              1
            </div>
            <h4 className="font-semibold mb-2">Créez un quiz</h4>
            <p className="text-sm text-gray-600">
              Les enseignants créent des quiz avec différentes questions
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              2
            </div>
            <h4 className="font-semibold mb-2">Lancez une session</h4>
            <p className="text-sm text-gray-600">
              Générez un code d&apos;accès et partagez-le avec vos étudiants
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              3
            </div>
            <h4 className="font-semibold mb-2">Participez en temps réel</h4>
            <p className="text-sm text-gray-600">
              Les étudiants répondent et voient les résultats instantanément
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
