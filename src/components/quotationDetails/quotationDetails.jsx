import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchQuotationById } from "../../services/api/quotations";
import { fetchCompanyById } from "../../services/api/companies";
import { GridLoader } from "react-spinners";
import styles from "./style.module.scss";
import GaugeChart from "react-gauge-chart";

export default function QuotationDetails() {
  const { quotationId } = useParams();
  const [quotation, setQuotation] = useState({});
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false); // State to toggle visibility



  useEffect(() => {
    const loadQuotationData = async () => {
      try {
        setLoading(true);
        const data = await fetchQuotationById(quotationId);
        const companyData = await fetchCompanyById(data.company_id);

        setQuotation(data);
        setCompany(companyData);
      } catch (err) {
        setError("Impossible de charger les données du projet.");
      } finally {
        setLoading(false);
      }
    };
    loadQuotationData();
  }, [quotationId]);


  

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) return <p className={styles.error}>{error}</p>;

  const statusColor = (status) => {
    if (status === "accepted") return "green";
    if (status === "pending") return "orange";
    if (status === "refused") return "red";
    return "black";
  };

 // on compte le total en euros des lines contentant "Pix_" dans le product_code
 const totalPixProductCode = quotation.quotation_lines
  .filter((line) => line.product_code.startsWith("Pix_"))
  .reduce((acc, line) => acc + line.unit_job_costing, 0);


 
    

  return (
    <div className={styles.quotationContainer}>
      <h1>Détails du devis - {quotation.number}</h1>

      <div className={styles.header}>
        <div className={styles.section1}>
          <p>
            <strong>Numéro :</strong> {quotation.number}
          </p>

          <p>
            <strong>Titre :</strong> {quotation.title}
          </p>
          <p>
            <strong>Nom de l'entreprise :</strong> {quotation.company_name}
          </p>
          <p>
            <strong>Date :</strong>{" "}
            {new Date(quotation.date).toLocaleDateString()}
          </p>
          {/* <p>
            <strong>Date d'expiration :</strong>{" "}
            {new Date(quotation.expiry_date).toLocaleDateString()}
          </p> */}
          {/* <p>
            <strong>Date de dernière mise à jour :</strong>{" "}
            {new Date(quotation.last_update_date).toLocaleDateString()}
          </p> */}
      
     
      

          <p>
            <strong>Commercial :</strong>{" "}
            {company.business_manager?.name || "Inconnu"}
          </p>
          <p>
            <strong>Statut :</strong>{" "}
            <span style={{ color: statusColor(quotation.status) }}>
              {quotation.status}
            </span>
          </p>
          <p>
            <strong>Commentaire(s):</strong> {quotation.comments}
          </p>

          {/* <p>
            <strong>Id projet :</strong>{" "}
            <button onClick={() => handleClickProject(quotation.project_id)}>
              {quotation.project_id}
            </button>
          </p> */}
          {/* <p>
            <strong>Id opportunité :</strong> {quotation.opportunity_id}
          </p>
          <p>
            <strong>Id contrat :</strong> {quotation.contract_id}
          </p> */}
        </div>
        <div className={styles.section2}>
          {/* <p>
            <strong>Id entreprise :</strong> {quotation.company_id}
          </p> */}

          <h3>
            <strong>Montant total HT:</strong> {quotation.pre_tax_amount}€
          </h3>
          <h3>
            <strong>Marge total :</strong>  {quotation.margin.toFixed(2)} €
          </h3>
          <h3>
            {" "}
            <strong>Marge (%) </strong>
          </h3>
          <GaugeChart
            id="margin-gauge"
            nrOfLevels={5}
            percent={quotation.margin / quotation.pre_tax_amount}
            colors={["#f78800", "#109f00"]}
            textColor="#000"
            needleColor="#4520ff"
          />
        </div>
      </div>

      <div className={styles.quotationLines}>
        {/* <h2>Détails du devis</h2> */}
        <button
          onClick={() => setShowDetails(!showDetails)} // Toggle visibility on click
          className={styles.toggleButton}
        > <i class="fa-solid fa-bars"></i> 
          {showDetails ?  "  Cacher les détails du devis" : "  Voir les détails du devis"}
        </button>

        {/* Conditionally render the table based on `showDetails` */}
        {showDetails && (
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Quantité</th>
                <th>Prix unitaire HT</th>
                <th>Montant total HT</th>
                <th>Coût d'achat unit</th>
                <th>Marge total</th>
                <th>Marge en %</th>
              </tr>
            </thead>
            <tbody>
              {quotation.quotation_lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.product_code}</td>
                  <td>{line.product_name}</td>
                  <td>{line.quantity}</td>
                  <td>{line.price} €</td>
                  <td>{line.pre_tax_amount} €</td>
                  <td>{line.unit_job_costing} €</td>
                  <td>{line.margin} €</td>
                  <td>
                    {((line.margin / line.pre_tax_amount) * 100).toFixed(2)} %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className={styles.totals}>
          <p>
            <strong>Montant total HT :</strong> {quotation.pre_tax_amount} €
          </p>
          <p>
            <strong>Montant total TTC :</strong> {quotation.total_amount} €
          </p>
          <p>
            <strong>Marge totale :</strong> {quotation.margin.toFixed(2)} €
          </p>
          <p>
            <strong>Marge % :</strong>{" "}
            {((quotation.margin / quotation.pre_tax_amount) * 100).toFixed(2)} %
          </p>

          <p>
            <strong>Cout total des prestations :</strong>{" "}
            {totalPixProductCode} €
          </p>
        </div>
      </div>

      <div className={styles.footer}>
        <a
          href={quotation.public_path}
          target="_blank"
          rel="noreferrer"
          className={styles.button}
        >
          Voir le devis dans Axonaut
        </a>
        <a
          href={quotation.customer_portal_url}
          target="_blank"
          rel="noreferrer"
          className={styles.button}
        >
          Voir le devis dans le portail client
        </a>
      </div>
    </div>
  );
}





  // // Calcul de la marge réelle
  // const margeReelle = (project.actual_revenue - project.actual_expenses_cost) / project.actual_revenue;


  //           {/* Jauge représentant la marge réelle */}
  //           <GaugeChart
  //           id="margin-gauge"
  //           nrOfLevels={5}
  //           percent={margeReelle}
  //           arcsLength={[0.15, 0.10, 0.30, 0.45 ]} // Définir les longueurs des arcs
  //           colors={['#EA4228', '#F5CD19',  '#5BE12C', '#109f30' ]} // Couleurs des arcs
  //           textColor="#000"
  //           needleColor="#4520ff"
  //           arcPadding={0.02}
  //         />