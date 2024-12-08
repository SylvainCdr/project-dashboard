import styles from "./style.module.scss";
import { fetchQuotations } from "../../services/api/quotations";
import React, { useEffect, useState } from "react";
import { GridLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import SearchQuotations from "../../components/searchQuotations/searchQuotations";

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  const handleClickProject = (quotationId) => {
    navigate(`/quotations/${quotationId}`);
  };

  // useEffect(() => {
  //   const loadProjectsData = async () => {
  //     try {
  //       setLoading(true);
  //       // Appel API sans limit, on gère cela côté client
  //       const data = await fetchProjects(page); // L'API retourne 500 éléments par page
  //       // On ne garde que les 50 premiers éléments
  //       const limitedData = data.slice(0, 25); // On limite à 50 éléments
  //       setProjects(limitedData);
  //     } catch (err) {
  //       setError(err.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   loadProjectsData();
  // }, [page]);

  useEffect(() => {
    const loadQuotationsData = async () => {
      try {
        setLoading(true); // Mettre le loading à true avant de commencer l'appel
        const data = await fetchQuotations(page);
        const limitedData = data.slice(0, 10); // On limite à 50 éléments
        setQuotations(limitedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false); // Mettre le loading à false une fois les données chargées
      }
    };
    loadQuotationsData();
  }, [page]);

  const handleNextPage = () => setPage((prev) => prev + 1);
  const handlePreviousPage = () => setPage((prev) => Math.max(prev - 1, 1));

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement des devis...</p>
      </div>
    );
  }

  if (error) return <p>Erreur : {error}</p>;


  const statusColor = (status) => {
    if (status === "accepted") return "green";
    if (status === "pending") return "orange";
    if (status === "refused") return "red";
    return "black";
  };

  return (
    <div className={styles.quotationsContainer}>
      <h1>Gestion des Devis</h1>

      <SearchQuotations />

      <table className={styles.quotationTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Numéro</th>
            <th>Entreprise</th>
            <th>Commercial(e)</th>
            <th>Date</th>
            <th>Statut</th>
            <th>Montant HT</th>
            <th>Montant TTC</th>
            <th>Marge (€)</th>
            <th>Marge (%)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {quotations.map((quotation) => (
            <tr key={quotation.id}>
              <td>{quotation.id}</td>
              <td>{quotation.number}</td>
              <td>{quotation.company_name || "Inconnue"}</td>
              <td>{quotation.user_id}</td>
              <td>{new Date(quotation.date).toLocaleDateString()}</td>
              <td>
                {" "}
                <span style={{ color: statusColor(quotation.status) }}>
                  {quotation.status}
                </span>
              </td>

              <td>{quotation.pre_tax_amount.toFixed(2)} €</td>
              <td>{quotation.total_amount.toFixed(2)} €</td>
              <td>{quotation.margin.toFixed(2)} €</td>
              <td>
                {((quotation.margin / quotation.pre_tax_amount) * 100).toFixed(
                  2
                )}{" "}
                %
              </td>
              <td className={styles.actionCell}>
                <button onClick={() => handleClickProject(quotation.id)}>
                  Voir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className={styles.footer}>
        <button onClick={handlePreviousPage} disabled={page === 1}>
          Page précédente
        </button>
        <button onClick={handleNextPage}>Page suivante</button>
      </footer>
    </div>
  );
}
