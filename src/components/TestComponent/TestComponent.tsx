interface TestComponentProps {
  name: string;
}

function TestComponent({ name }: TestComponentProps) {
  return (
    <div>
      <h1>Hola, {name}</h1>
      <p>Componente funcionando correctamente.</p>
    </div>
  );
}

export default TestComponent;