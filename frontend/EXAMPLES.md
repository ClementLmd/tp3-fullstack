# Exemples Pratiques - TanStack Query & Toast

## 🎯 Exemples Concrets pour le Projet Quiz

### Exemple 1 : Se connecter (Login)

```typescript
"use client";

import { useApiMutation } from "@/lib/hooks/useApiError";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  // Mutation pour se connecter
  const loginMutation = useApiMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiClient.post("/auth/login", credentials);
      return response.data; // { token, user }
    },
    showErrorToast: true, // Affiche automatiquement les erreurs
    showSuccessToast: true,
    successMessage: "Connexion réussie ! 🎉",
    onSuccess: (data) => {
      // Sauvegarde les données d'authentification
      setAuth(data.user, data.token);
      // Redirige vers le dashboard
      router.push("/dashboard");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    loginMutation.mutate({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input name="email" type="email" label="Email" required />
      <Input name="password" type="password" label="Mot de passe" required />
      <Button
        type="submit"
        isLoading={loginMutation.isPending}
        disabled={loginMutation.isPending}
      >
        Se connecter
      </Button>
    </form>
  );
}
```

**Workflow :**

1. Utilisateur remplit le formulaire et clique sur "Se connecter"
2. `loginMutation.mutate()` est appelé → `isPending = true` → Bouton affiche "Chargement..."
3. Requête envoyée à `/api/auth/login`
4. **Si succès** → Toast vert "Connexion réussie ! 🎉" → Données sauvegardées → Redirection
5. **Si erreur** → Toast rouge avec message (ex: "Email ou mot de passe incorrect") → Formulaire reste affiché

---

### Exemple 2 : Récupérer la liste des quiz

```typescript
"use client";

import { useApiQuery } from "@/lib/hooks/useApiError";
import { apiClient } from "@/lib/api/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";

export function QuizList() {
  // Query pour récupérer les quiz
  const {
    data: quizzes,
    isLoading,
    error,
  } = useApiQuery({
    queryKey: ["quizzes"], // Clé de cache
    queryFn: async () => {
      const response = await apiClient.get("/quizzes");
      return response.data; // Retourne les quiz
    },
    showErrorToast: true, // Affiche automatiquement les erreurs en toast
  });

  // État de chargement
  if (isLoading) {
    return <LoadingSpinner text="Chargement des quiz..." />;
  }

  // Erreur (déjà affichée en toast automatiquement)
  if (error) {
    return <div>Impossible de charger les quiz</div>;
  }

  // Affichage des quiz
  return (
    <div className="grid gap-4">
      {quizzes?.map((quiz) => (
        <Card key={quiz.id} title={quiz.title}>
          <p>{quiz.description}</p>
        </Card>
      ))}
    </div>
  );
}
```

**Workflow :**

1. Composant monté → TanStack Query appelle automatiquement `queryFn`
2. Pendant le chargement → `isLoading = true` → Affiche le spinner
3. **Si succès** → `data` contient les quiz → Affiche la liste
4. **Si erreur** → Toast rouge affiché automatiquement → `error` contient l'erreur
5. Les données sont mises en cache → Si tu recharges le composant, pas de nouvelle requête (données instantanées)

---

### Exemple 3 : Créer un quiz

```typescript
"use client";

import { useApiMutation } from "@/lib/hooks/useApiError";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreateQuizForm() {
  const queryClient = useQueryClient();

  // Mutation pour créer un quiz
  const createQuiz = useApiMutation({
    mutationFn: async (quizData: { title: string; description: string }) => {
      const response = await apiClient.post("/quizzes", quizData);
      return response.data; // Retourne le quiz créé
    },
    showErrorToast: true,
    showSuccessToast: true,
    successMessage: "Quiz créé avec succès ! ✅",
    onSuccess: () => {
      // Invalide le cache de la liste des quiz
      // → TanStack Query va automatiquement recharger la liste
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    createQuiz.mutate({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input name="title" label="Titre du quiz" required />
      <Input name="description" label="Description" />
      <Button
        type="submit"
        isLoading={createQuiz.isPending}
        disabled={createQuiz.isPending}
      >
        Créer le quiz
      </Button>
    </form>
  );
}
```

**Workflow :**

1. Utilisateur remplit le formulaire et clique sur "Créer"
2. `createQuiz.mutate()` appelé → `isPending = true` → Bouton désactivé
3. Requête POST vers `/api/quizzes`
4. **Si succès** → Toast vert "Quiz créé avec succès ! ✅" → Cache invalidé → Liste des quiz se recharge automatiquement
5. **Si erreur** → Toast rouge (ex: "Ce titre existe déjà") → Formulaire reste affiché

---

### Exemple 4 : Utiliser le Toast manuellement

```typescript
"use client";

import { useToastContext } from "@/lib/providers/ToastProvider";
import { Button } from "@/components/ui/Button";

export function MyComponent() {
  const toast = useToastContext();

  const handleAction = async () => {
    try {
      // Faire quelque chose...
      await someAsyncOperation();

      // Afficher un toast de succès
      toast.success("Opération réussie !");
    } catch (error) {
      // Afficher un toast d'erreur
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <div>
      <Button onClick={handleAction}>Faire une action</Button>

      {/* Exemples de tous les types de toast */}
      <div className="space-x-2">
        <Button onClick={() => toast.success("Succès !")}>Success</Button>
        <Button onClick={() => toast.error("Erreur !")}>Error</Button>
        <Button onClick={() => toast.warning("Attention !")}>Warning</Button>
        <Button onClick={() => toast.info("Information")}>Info</Button>
      </div>
    </div>
  );
}
```

---

## 🔄 Flux de données complet

```
┌─────────────────┐
│   Composant     │
│   React         │
└────────┬────────┘
         │
         │ useApiQuery / useApiMutation
         ▼
┌─────────────────┐
│ TanStack Query  │
│   Provider      │
└────────┬────────┘
         │
         │ apiClient.get/post/...
         ▼
┌─────────────────┐
│  Axios Client   │
│  (interceptor)  │
└────────┬────────┘
         │
         │ HTTP Request
         ▼
┌─────────────────┐
│   Backend API   │
│   (Express)     │
└────────┬────────┘
         │
         │ Response / Error
         ▼
┌─────────────────┐
│  Axios Client   │
│  (interceptor)  │
│  → transforme   │
│    l'erreur     │
└────────┬────────┘
         │
         │ Error avec userMessage
         ▼
┌─────────────────┐
│ TanStack Query  │
│   onError       │
└────────┬────────┘
         │
         │ toastErrorFn(message)
         ▼
┌─────────────────┐
│  Toast Provider │
│  → Affiche le   │
│    toast        │
└─────────────────┘
```

---

## 💡 Conseils d'utilisation

### ✅ À faire :

- Utiliser `useApiQuery` pour récupérer des données
- Utiliser `useApiMutation` pour modifier des données
- Laisser `showErrorToast: true` pour les erreurs automatiques
- Utiliser `showSuccessToast: true` pour les actions importantes

### ❌ À éviter :

- Ne pas gérer manuellement les états `isLoading` si tu utilises TanStack Query
- Ne pas créer plusieurs requêtes pour les mêmes données (utilise le cache)
- Ne pas oublier d'invalider le cache après une mutation

---

## 🎓 Exercice pratique

Essaie de créer un composant qui :

1. Récupère un quiz par son ID avec `useApiQuery`
2. Permet de modifier le quiz avec `useApiMutation`
3. Affiche les erreurs automatiquement
4. Recharge les données après modification

Bonne chance ! 🚀
