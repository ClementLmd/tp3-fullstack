# Guide TanStack Query & Toast - Explications et Exemples

## 🍞 Qu'est-ce qu'un Toast ?

Un **Toast** est une notification temporaire qui apparaît généralement en haut à droite de l'écran pour informer l'utilisateur d'un événement (succès, erreur, avertissement, info).

### Exemples visuels :

- ✅ **Succès** : "Quiz créé avec succès !" (vert)
- ❌ **Erreur** : "Erreur lors de la connexion" (rouge)
- ⚠️ **Avertissement** : "Votre session expire bientôt" (jaune)
- ℹ️ **Info** : "Nouvelle question disponible" (bleu)

Les toasts disparaissent automatiquement après quelques secondes (5 secondes par défaut).

---

## 🔄 TanStack Query (React Query) - C'est quoi ?

**TanStack Query** est une bibliothèque qui simplifie la gestion des données dans React. Elle gère automatiquement :

- ✅ Le chargement des données (loading states)
- ✅ La mise en cache
- ✅ La synchronisation avec le serveur
- ✅ Les erreurs
- ✅ La revalidation automatique

### Concepts clés :

#### 1. **Query** (Lecture de données)

Pour récupérer des données depuis le serveur.

#### 2. **Mutation** (Modification de données)

Pour créer, modifier ou supprimer des données.

#### 3. **Cache**

TanStack Query met en cache les données pour éviter de refaire les mêmes requêtes.

---

## 📋 Workflow Complet avec Exemples

### Exemple 1 : Récupérer la liste des quiz (Query)

```typescript
import { useApiQuery } from "@/lib/hooks/useApiError";
import { apiClient } from "@/lib/api/client";

function QuizList() {
  // useApiQuery gère automatiquement :
  // - Le chargement (isLoading)
  // - Les erreurs (affiche un toast automatiquement)
  // - Le cache
  const {
    data: quizzes,
    isLoading,
    error,
  } = useApiQuery({
    queryKey: ["quizzes"], // Clé unique pour le cache
    queryFn: async () => {
      // Fonction qui récupère les données
      const response = await apiClient.get("/quizzes");
      return response.data; // Retourne les données
    },
    showErrorToast: true, // Affiche automatiquement les erreurs en toast
  });

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    // L'erreur est déjà affichée en toast automatiquement !
    return <div>Erreur lors du chargement</div>;
  }

  return (
    <div>
      {quizzes?.map((quiz) => (
        <div key={quiz.id}>{quiz.title}</div>
      ))}
    </div>
  );
}
```

**Ce qui se passe :**

1. Au chargement du composant, TanStack Query appelle `queryFn`
2. Pendant le chargement, `isLoading = true`
3. Si succès → `data` contient les quiz, `isLoading = false`
4. Si erreur → Toast d'erreur affiché automatiquement, `error` contient l'erreur
5. Les données sont mises en cache avec la clé `['quizzes']`
6. Si tu recharges le composant, les données viennent du cache (pas de nouvelle requête)

---

### Exemple 2 : Créer un quiz (Mutation)

```typescript
import { useApiMutation } from "@/lib/hooks/useApiError";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";

function CreateQuizForm() {
  const queryClient = useQueryClient();

  // useApiMutation gère automatiquement :
  // - Le chargement (isPending)
  // - Les erreurs (affiche un toast automatiquement)
  // - Le succès (peut afficher un toast de succès)
  const createQuiz = useApiMutation({
    mutationFn: async (quizData: { title: string; description: string }) => {
      // Fonction qui crée le quiz
      const response = await apiClient.post("/quizzes", quizData);
      return response.data;
    },
    showErrorToast: true, // Affiche les erreurs en toast
    showSuccessToast: true, // Affiche le succès en toast
    successMessage: "Quiz créé avec succès !", // Message de succès
    onSuccess: () => {
      // Après le succès, on invalide le cache pour recharger la liste
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    createQuiz.mutate({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Titre du quiz" />
      <input name="description" placeholder="Description" />
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

**Ce qui se passe :**

1. L'utilisateur soumet le formulaire
2. `createQuiz.mutate()` est appelé avec les données
3. Pendant la requête → `isPending = true`, le bouton affiche "Chargement..."
4. Si succès → Toast vert "Quiz créé avec succès !", le cache `['quizzes']` est invalidé (recharge automatique de la liste)
5. Si erreur → Toast rouge avec le message d'erreur automatique

---

### Exemple 3 : Utilisation manuelle du Toast

Parfois, tu veux afficher un toast manuellement (pas lié à une requête API) :

```typescript
import { useToastContext } from "@/lib/providers/ToastProvider";

function MyComponent() {
  const toast = useToastContext();

  const handleClick = () => {
    // Afficher différents types de toasts
    toast.success("Opération réussie !");
    toast.error("Une erreur est survenue");
    toast.warning("Attention !");
    toast.info("Information importante");
  };

  return <button onClick={handleClick}>Cliquer</button>;
}
```

---

### Exemple 4 : Gestion d'erreur manuelle (sans TanStack Query)

Si tu utilises `apiClient` directement (sans TanStack Query) :

```typescript
import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/utils/errorHandler";
import { useToastContext } from "@/lib/providers/ToastProvider";

function MyComponent() {
  const toast = useToastContext();

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      toast.success("Connexion réussie !");
      // Faire quelque chose avec response.data
    } catch (error) {
      // handleApiError convertit l'erreur en message utilisateur-friendly
      const errorMessage = handleApiError(error);
      toast.error(errorMessage); // Affiche le toast d'erreur
    }
  };

  return (
    <button onClick={() => handleLogin("user@example.com", "password")}>
      Se connecter
    </button>
  );
}
```

---

## 🔍 Comment ça marche sous le capot ?

### 1. Axios Interceptor (dans `lib/api/client.ts`)

```typescript
// Quand une requête échoue, l'interceptor transforme l'erreur
apiClient.interceptors.response.use(
  (response) => response, // Succès → retourne la réponse
  (error) => {
    // Erreur → ajoute un message utilisateur-friendly
    const userMessage = handleApiError(error);
    error.userMessage = userMessage; // Ajoute le message à l'erreur
    return Promise.reject(error); // Rejette l'erreur (pour que catch la capture)
  }
);
```

### 2. Error Handler (dans `lib/utils/errorHandler.ts`)

```typescript
// Convertit les codes HTTP en messages français
handleApiError(error) {
  if (error.response?.status === 401) {
    return "Vous n'êtes pas authentifié. Veuillez vous connecter.";
  }
  if (error.response?.status === 404) {
    return "Ressource introuvable.";
  }
  // etc...
}
```

### 3. TanStack Query Provider (dans `lib/providers/QueryProvider.tsx`)

```typescript
// Configure TanStack Query pour afficher automatiquement les erreurs
new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        const message = handleApiError(error);
        toastErrorFn(message); // Affiche le toast
      },
    },
  },
});
```

### 4. Toast Provider (dans `lib/providers/ToastProvider.tsx`)

```typescript
// Gère l'affichage des toasts dans l'interface
<ToastProvider>
  {children}
  <ToastContainer toasts={toasts} /> {/* Affiche les toasts */}
</ToastProvider>
```

---

## 📊 Comparaison : Avec vs Sans TanStack Query

### ❌ Sans TanStack Query (ancienne méthode)

```typescript
function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    apiClient
      .get("/quizzes")
      .then((res) => {
        setQuizzes(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
        // Gérer l'erreur manuellement...
      });
  }, []); // Mais quand recharger ? Comment gérer le cache ?

  // Beaucoup de code répétitif...
}
```

### ✅ Avec TanStack Query (notre méthode)

```typescript
function QuizList() {
  const {
    data: quizzes,
    isLoading,
    error,
  } = useApiQuery({
    queryKey: ["quizzes"],
    queryFn: () => apiClient.get("/quizzes").then((res) => res.data),
    showErrorToast: true, // Erreur gérée automatiquement !
  });

  // Beaucoup moins de code, gestion automatique du cache, revalidation, etc.
}
```

---

## 🎯 Cas d'usage concrets dans notre projet

### Cas 1 : Page de connexion

```typescript
// app/login/page.tsx
import { useApiMutation } from "@/lib/hooks/useApiError";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";

export default function LoginPage() {
  const { setAuth } = useAuthStore();

  const login = useApiMutation({
    mutationFn: async ({ email, password }) => {
      const response = await apiClient.post("/auth/login", { email, password });
      return response.data; // { token, user }
    },
    showErrorToast: true, // Affiche "Erreur lors de la connexion" si échec
    showSuccessToast: true,
    successMessage: "Connexion réussie !",
    onSuccess: (data) => {
      setAuth(data.user, data.token); // Sauvegarde dans le store
      router.push("/dashboard"); // Redirige
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        login.mutate({ email: "...", password: "..." });
      }}
    >
      {/* Formulaire */}
    </form>
  );
}
```

### Cas 2 : Liste des quiz avec rechargement automatique

```typescript
// components/QuizList.tsx
import { useApiQuery } from "@/lib/hooks/useApiError";

export function QuizList() {
  const { data: quizzes, isLoading } = useApiQuery({
    queryKey: ["quizzes"],
    queryFn: () => apiClient.get("/quizzes").then((res) => res.data),
    refetchInterval: 30000, // Recharge toutes les 30 secondes
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {quizzes?.map((quiz) => (
        <QuizCard key={quiz.id} quiz={quiz} />
      ))}
    </div>
  );
}
```

---

## 🚀 Avantages de notre système

1. **Messages d'erreur clairs** : Automatiquement traduits en français
2. **Moins de code** : Pas besoin de gérer manuellement les états de chargement/erreur
3. **Cache intelligent** : Évite les requêtes inutiles
4. **Revalidation automatique** : Les données se mettent à jour automatiquement
5. **UX améliorée** : Les utilisateurs voient toujours des messages clairs

---

## 📚 Ressources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
