import { BarLoader, GridLoader } from "react-spinners";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProjectById } from "../../services/api/projects";
import { fetchCompanyById } from "../../services/api/companies";
import { fetchExpensesByProject } from "../../services/api/expenses";
import { fetchSupplierContractsByProjectTitle } from "../../services/api/contracts";
import styles from "./style.module.scss";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import GaugeChart from "react-gauge-chart";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState({});
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expandedExpenses, setExpandedExpenses] = useState({});
  const [loadingExpenses, setLoadingExpenses] = useState(false); // État de chargement des dépenses
  const [loadingContracts, setLoadingContracts] = useState(false); // Nouvel état pour les Supplier Contracts
  const [supplierContracts, setSupplierContracts] = useState([]); // Nouvel état pour les Supplier Contracts

  const toggleExpense = (expenseId) => {
    setExpandedExpenses((prev) => ({
      ...prev,
      [expenseId]: !prev[expenseId],
    }));
  };

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        const projectData = await fetchProjectById(projectId);
        const companyData = await fetchCompanyById(projectData.company_id);

        setProject(projectData);
        setCompany(companyData);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des données du projet.");
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId]);

  console.log("project", project);

  useEffect(() => {
    const loadData = async () => {
      if (!project.name || !project.estimated_start) {
        console.error(
          "Le nom du projet ou la date de début estimée est indéfini."
        );
        return;
      }

      console.log("Nom du projet utilisé pour la recherche :", project.name);
      console.log("Date de début estimée :", project.estimated_start);

      try {
        setLoadingContracts(true); // Début du chargement
        setLoadingExpenses(true); // Début du chargement

        // Charger les contrats fournisseurs
        const supplierContractsData =
          await fetchSupplierContractsByProjectTitle(
            project.name,
            project.estimated_start
          );

        // Charger les dépenses
        const expensesData = await fetchExpensesByProject(
          project.estimated_start,
          project.estimated_end,
          projectId
        );

        console.log("Dépenses chargées :", expensesData);

        // Extraire tous les IDs des dépenses
        const expenseIds = expensesData.map((expense) => expense.id);

        // Ajouter les IDs des dépenses comme une propriété supplémentaire
        const updatedSupplierContracts = supplierContractsData.map(
          (contract) => ({
            ...contract,
            hasExpense: contract.expenses.some((expense) =>
              expenseIds.includes(expense.id)
            ),
          })
        );

        // Mettre à jour les états
        setSupplierContracts(updatedSupplierContracts);
        setExpenses(expensesData);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des données.");
      } finally {
        setLoadingContracts(false); // Fin du chargement
        setLoadingExpenses(false); // Fin du chargement
      }
    };

    loadData();
  }, [project.name, project.estimated_start, project.estimated_end, projectId]);

  console.log("supplierContracts :", supplierContracts);

  // Calcul de la marge réelle
  const margeReelle =
    (project.actual_revenue - project.actual_expenses_cost) /
    project.actual_revenue;

  // Préparation des données pour le graphique
  const difference =
  project.actual_revenue - project.actual_expenses_cost || 0;

  const supplierContractAmount = supplierContracts
    .filter((contract) => !contract.hasExpense)
    .reduce((acc, contract) => acc + contract.pre_tax_amount, 0);

  const chartData = [
    { name: "Commande", estimatedRevenue: project.estimated_revenue },
    { name: "Recette", actualRevenue: project.actual_revenue },
    {
      name: "Dépenses/Commandes",
      actualExpenses: project.actual_expenses_cost, // Dépenses réelles
      supplierContracts: supplierContractAmount, // Commandes à venir
    },
    { name: "Marge Nette Actuelle", difference },
  ];

  // Calcul des totaux pour les dépenses TTC
  const totalExpensesTTC = expenses.reduce(
    (acc, expense) => acc + expense.total_amount,
    0
  );
  const totalLeftToPayTTC = expenses.reduce(
    (acc, expense) => acc + expense.left_to_pay,
    0
  );

  // Calcul du pourcentage restant à payer
  const percentageLeftToPay = totalExpensesTTC
    ? (totalLeftToPayTTC / totalExpensesTTC) * 100
    : 0;

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.projectContainer}>
      <h1>Détails du projet - {project.number}</h1>

      <div className={styles.header}>
        <div className={styles.section1}>
          <p>
            <strong>Date de début estimé : </strong>
            {new Date(project.estimated_start).toLocaleDateString()}
          </p>
          <p>
            <strong>Date de fin estimé : </strong>
            {new Date(project.estimated_end).toLocaleDateString()}
          </p>
          <p>
            <strong>Date de début réelle : </strong>
            {new Date(project.actual_start).toLocaleDateString()}
          </p>
          <p>
            <strong>Date de fin réelle : </strong>
            {new Date(project.actual_end).toLocaleDateString()}
          </p>
          <p>
            <strong>Entreprise :</strong>{" "}
            {company.name || "Entreprise inconnue"}
          </p>
          <p>
            <strong>Adresse :</strong> {company.address_street}
          </p>
          <p>
            <strong>Ville :</strong> {company.address_city} {company.zip_code} (
            {company.address_country})
          </p>
          <p>
            <strong>Commercial en charge :</strong>{" "}
            {company.business_manager?.name || "Inconnu"}
          </p>
        </div>
        <div className={styles.section2}>
          <h3>
            <strong>Montant total HT:</strong>{" "}
            {project.actual_revenue.toFixed(2)} €
          </h3>
          <h3>
            <strong>Total des dépenses :</strong>{" "}
            {project.actual_expenses_cost.toFixed(2)} €
          </h3>
          <h3>
            <strong>Marge nette :</strong>{" "}
            {(project.actual_revenue - project.actual_expenses_cost).toFixed(2)}{" "}
            €
          </h3>
          <h3>
            <strong>Marge (%) </strong>
          </h3>
          <GaugeChart
            id="margin-gauge"
            nrOfLevels={5}
            percent={margeReelle}
            arcsLength={[0.15, 0.1, 0.3, 0.45]}
            colors={["#EA4228", "#F5CD19", "#5BE12C", "#109f30"]}
            textColor="#000"
            needleColor="#4520ff"
            arcPadding={0.02}
          />
        </div>
      </div>

      {/* Section Graphique */}
      <div className={styles.graphContainer}>
        <h2>Graphique des coûts et revenus</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
            barSize={150}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="estimatedRevenue" fill="#3467ff" name="Commande" />
            <Bar dataKey="actualRevenue" fill="#00950c" name="Recette" />
            <Bar
              dataKey="actualExpenses"
              stackId="expenses"
              fill="#e10069"
              name="Dépenses payées"
            />
            <Bar
              dataKey="supplierContracts"
              stackId="expenses"
              fill="#ffa500"
              name="Dépenses à venir"
            />
            <Bar dataKey="difference" fill="#FFD700" name="Marge Nette" />
          </BarChart>
        </ResponsiveContainer>
      </div>

{/* Section des dépenses */}
<div className={styles.expenses}>
  <h1>Dépenses</h1>
  {loadingExpenses ? ( // Affichage du loader pour les dépenses
    <div className={styles.loaderContainer}>
      <BarLoader color="#4520ff" loading={loadingExpenses} width={200} />
      <p>Chargement des dépenses...</p>
    </div>
  ) : expenses.length > 0 ? (
    <table>
      <thead>
        <tr>
          <th>Titre</th>
          <th>Date</th>
          <th>Montant HT</th>
          <th>Montant TTC</th>
          <th>Reste à payer TTC</th>
          <th>Nom comptable</th>
          <th>Fournisseur</th>
          <th>Projet</th>
          <th>Détails</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((expense) => (
          <React.Fragment key={expense.id}>
            <tr onClick={() => toggleExpense(expense.id)}>
              <td>
                <span>+</span>
                {expense.title}
              </td>
              <td>{new Date(expense.date).toLocaleDateString()}</td>
              <td>{expense.pre_tax_amount.toFixed(2)} €</td>
              <td>{expense.total_amount.toFixed(2)} €</td>
              <td>{expense.left_to_pay.toFixed(2)} €</td>
              <td>{expense.accounting_code_name}</td>
              <td>{expense.supplier_name}</td>
              <td>{expense.project_id}</td>
              <td>
                <a
                  href={expense.public_path}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Lien
                </a>
              </td>
            </tr>
            {expandedExpenses[expense.id] && (
              <tr>
                <td colSpan="9">
                  <table className={styles.expenseDetails}>
                    <thead>
                      <tr>
                        <th>Article</th>
                        <th>Quantité</th>
                        <th>Montant HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expense.expense_lines.map((line, index) => (
                        <tr key={index}>
                          <td>{line.title}</td>
                          <td>{line.quantity}</td>
                          <td>
                            {line.total_pre_tax_amount.toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  ) : (
    <p>Aucune dépense trouvée.</p>
  )}
</div>

{/* Section des contrats fournisseurs */}
<div className={styles.supplierContracts}>
  <h1>Commandes fournisseurs</h1>
  {loadingContracts ? ( // Affichage du loader pour les contrats fournisseurs
    <div className={styles.loaderContainer}>
      <BarLoader color="#4520ff" loading={loadingContracts} width={200} />
      <p>Chargement des commandes fournisseurs...</p>
    </div>
  ) : supplierContracts.length > 0 ? (
    <table>
      <thead>
        <tr>
          <th>Titre</th>
          <th>Date de début</th>
          <th>Montant HT</th>
          <th>Montant TTC</th>
          <th>Fournisseur</th>
          <th>Commentaire</th>
          <th>expense ID</th>
        </tr>
      </thead>
      <tbody>
        {supplierContracts.map((contract) => (
          <tr
            key={contract.id}
            style={{
              backgroundColor: contract.hasExpense ? "lightgreen" : "white",
            }}
          >
            <td>{contract.title}</td>
            <td>{new Date(contract.start_date).toLocaleDateString()}</td>
            <td>{contract.pre_tax_amount.toFixed(2)} €</td>
            <td>{contract.total_amount.toFixed(2)} €</td>
            <td>{contract.supplier.name}</td>
            <td>
              <div
                dangerouslySetInnerHTML={{
                  __html: contract.comments
                    ? contract.comments.slice(0, 90) +
                      (contract.comments.length > 90 ? "..." : "")
                    : "Aucun commentaire",
                }}
              ></div>
            </td>
            <td>
              {contract.expenses.map((expense) => (
                <span key={expense.id}>{expense.id}, </span>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p>Aucun contrat fournisseur sans dépenses disponible.</p>
  )}
</div>

    </div>
  );
}
