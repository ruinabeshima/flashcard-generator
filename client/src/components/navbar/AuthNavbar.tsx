import { Link } from "react-router-dom";

export default function AuthNavbar() {
  return (
    <div className="w-full flex py-5 px-5">
      <Link to="/">
        <button className="btn btn-active">← Back</button>
      </Link>
    </div>
  );
}
