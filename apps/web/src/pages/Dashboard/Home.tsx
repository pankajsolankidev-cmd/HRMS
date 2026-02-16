import { useSelector } from "react-redux";
import type { RootState } from "../../context";

export default function Home() {
  const { id, roles, permissions } = useSelector(
    (state: RootState) => state.auth,
  );

  return (
    <>
      <div>
        <p>
          <strong>User ID:</strong> {id}
        </p>

        <p>
          <strong>Roles:</strong>
        </p>
        <ul>
          {roles.map((role) => (
            <li key={role}>{role}</li>
          ))}
        </ul>

        <p>
          <strong>Permissions:</strong>
        </p>
        <ul>
          {permissions.map((perm) => (
            <li key={perm}>{perm}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
