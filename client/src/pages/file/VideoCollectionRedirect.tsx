import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function VideoCollectionRedirect() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/file/videos?collection=${id}`, { replace: true });
  }, [id]);

  return null;
}
