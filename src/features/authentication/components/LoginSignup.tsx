import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { signUpUser, signInWithPassword, signOutUser } from '../services/authService';

import { Button } from '../../../components/ui/button';
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { Loader2 } from 'lucide-react';

const LoginSignup: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (action: 'login' | 'signup') => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let response;
      if (action === 'signup') {
        response = await signUpUser({ email, password });
        if (!response.error && response.data.user) {

          if (response.data.session) {
            setSuccessMessage('¡Registro exitoso! Ahora estás conectado.');
          } else {
            setSuccessMessage('¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.');
          }
        }
      } else {
        response = await signInWithPassword({ email, password });
        if (!response.error && response.data.user && response.data.session) {
          setSuccessMessage('¡Inicio de sesión exitoso!');
        }
      }

      if (response.error) {
        setError(response.error.message);
      }
    } catch (e: any) {
      console.error('[LoginSignup.handleSubmit] Caught error:', e);
      setError(e.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    setError(null);
    const { error: signOutError } = await signOutUser();
    if (signOutError) {
      setError(signOutError.message);
    } else {
      setSuccessMessage('Has cerrado sesión.');
      setEmail('');
      setPassword('');
    }
    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <p className="ml-2">Cargando autenticación...</p>
      </div>
    );
  }

  if (user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Bienvenido</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage && (

            <Alert variant="default" className="mb-4 bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
              <AlertTitle>Éxito</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          <p>Ya has iniciado sesión.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSignOut} disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="login" className="w-full max-w-md mx-auto">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
        <TabsTrigger value="signup">Registrarse</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert variant="default" className="bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
                <AlertTitle>Información</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="login-password">Contraseña</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => handleSubmit('login')} disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="signup">
        <Card>
          <CardHeader>
            <CardTitle>Registrarse</CardTitle>
            <CardDescription>Crea una nueva cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="signup-password">Contraseña</Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => handleSubmit('signup')} disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default LoginSignup;