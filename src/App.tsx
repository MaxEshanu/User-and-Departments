import style from "./App.module.css";
import Departments from "./Departments";

function App() {
  return (
    <div className={style.App}>
      <header className={style.header}>
      </header>
      <Departments />
    </div>
  );
}
export default App;
