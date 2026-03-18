import { Navigate } from "react-router-dom";

const Index = () => {
  // Por padrão redirecionamos para o dashboard se estiver "logado"
  // Para este MVP, vamos sempre redirecionar para o Dashboard (que está na rota raiz)
  // ou para o Login caso queira ver a tela de entrada.
  return <Navigate to="/" replace />;
};

export default Index;