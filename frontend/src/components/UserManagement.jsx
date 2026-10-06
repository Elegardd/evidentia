// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from "react";
import axios from "axios";
import EvidentiaFooter from "./EvidentiaFooter";

import DeleteModal from "./DeleteModal";

// Standard PNP Ranks ordered by hierarchy
const PNP_RANKS = [
  "PCOL", // Police Colonel
  "PLTCOL", // Police Lieutenant Colonel
  "PMAJ", // Police Major
  "PCPT", // Police Captain
  "PLT", // Police Lieutenant
  "PEMS", // Police Executive Master Sergeant
  "PCMS", // Police Chief Master Sergeant
  "PMSg", // Police Master Sergeant
  "PSSg", // Police Staff Sergeant
  "PCpl", // Police Corporal
  "Pat", // Police Patrolman / Patrolwoman
];

// The exact same station list used in EvidenceCollectorView
const BENGUET_AGENCIES = [
  "Baguio City Police Office (BCPO) - Main",
  "BCPO - Station 1 (Naguilian)",
  "BCPO - Station 2 (Camdas)",
  "BCPO - Station 3 (Pacdal)",
  "BCPO - Station 4 (Loakan)",
  "BCPO - Station 5 (Legarda)",
  "BCPO - Station 6 (Aurora Hill)",
  "BCPO - Station 7 (Abanao)",
  "BCPO - Station 8 (Kennon)",
  "BCPO - Station 9 (Irisan)",
  "BCPO - Station 10 (Marcos Highway)",
  "La Trinidad Municipal Police Station (LTMPS)",
  "Benguet Provincial Police Office (BPPO) - Camp Dangwa",
  "National Bureau of Investigation - Cordillera (NBI-CAR)",
  "PDEA - Cordillera Administrative Region (PDEA-CAR)",
  "CIDG - Benguet Provincial Field Unit",
  "PNP Forensic Group - Regional Forensic Unit (RFU-CAR)",
];

// eslint-disable-next-line no-unused-vars
export default function UserManagement({ onLogout }) {
  // Account Creation Form States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("officer");
  const [subRole, setSubRole] = useState(
    "Evidence Collector / Forensic Technician",
  );
  // Profile Field States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  // const [agencyRankTitle, setAgencyRankTitle] = useState("");
  // const [departmentDivision, setDepartmentDivision] = useState("");
  const [agencyRankTitle, setAgencyRankTitle] = useState(
    PNP_RANKS[PNP_RANKS.length - 1],
  );
  const [departmentDivision, setDepartmentDivision] = useState(
    BENGUET_AGENCIES[0],
  );

  // Profile View Modal States
  const [viewingUser, setViewingUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const handleViewClick = (user) => {
    setViewingUser(user);
    setIsViewModalOpen(true);
  };

  // Dynamic Registered Users Management State
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Active Operator Directory Filters State Matrix
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterSubRole, setFilterSubRole] = useState("all");
  const [filterAgency, setFilterAgency] = useState("all");
  const [filterRank, setFilterRank] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Notification Alert States
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CRUD Actions & Form Tracking State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    password: "",
    role: "",
    subRole: "",
    firstName: "",
    lastName: "",
    emailAddress: "",
    contactNumber: "",
    badgeNumber: "",
    agencyRankTitle: "",
    departmentDivision: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  // States for the custom delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userTargetedForDeletion, setUserTargetedForDeletion] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); // For loading state during delete

  // Interdependent Role Selector Handler for Account Provision Form
  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === "admin") {
      setSubRole("System Administrator");
    } else {
      setSubRole("Evidence Collector / Forensic Technician");
    }
  };

  // Interdependent Role Selector Handler for Inline Table Editing Matrix
  const handleEditRoleChange = (selectedRole) => {
    setEditForm((prev) => ({
      ...prev,
      role: selectedRole,
      subRole:
        selectedRole === "admin"
          ? "System Administrator"
          : "Evidence Collector / Forensic Technician",
    }));
  };

  // Automatic feedback alert clear timeout
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [message]);

  // Fetch all registered users from backend
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // const response = await axios.get("http://localhost:8081/get_users.php",
        const response = await axios.get("https://steadier-headscarf-maggot.ngrok-free.dev/get_users.php",
        {
          headers: {
            "ngrok-skip-browser-warning": "ayakerrtssss",
          },
        },
      );

      if (response.data.status === "success") {
        const sortedUsers = (response.data.users || []).sort((a, b) => {
          const usernameA = a.username || "";
          const usernameB = b.username || "";
          return usernameA.localeCompare(usernameB);
        });
        setUsersList(sortedUsers);
        setCurrentPage(1); // Reset back to first page when lists are updated
      }
    } catch (err) {
      console.error("Error pulling directory indices:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Run database sync on mounting cycle
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  // Helper function to validate Philippine phone number formats
  const validatePHPhoneNumber = (number) => {
    // Regex matches local 09XXXXXXXXX (11 digits) or international +639XXXXXXXXX (13 chars)
    const phRegex = /^(09|\+639)\d{9}$/;
    return phRegex.test(number.trim());
  };

  // Handle live contact number changes for create form
  const handleContactNumberChange = (value) => {
    // Allow plus sign only at the absolute beginning, strip out all other characters that aren't numbers
    let cleaned = value.replace(/(?!^\+)[^\d]/g, "");
    setContactNumber(cleaned);
  };

  // Handle live contact number changes for inline edit table
  const handleEditContactNumberChange = (value) => {
    let cleaned = value.replace(/(?!^\+)[^\d]/g, "");
    setEditForm((prev) => ({ ...prev, contactNumber: cleaned }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailAddress.trim())) {
      setMessageType("error");
      setMessage(
        "Please enter a valid real email address (e.g., operator@domain.com).",
      );
      return;
    }

    // Strict validation check for Philippine settings
    if (!validatePHPhoneNumber(contactNumber)) {
      setMessageType("error");
      setMessage(
        "Contact number must contain only numeric digits in a valid Philippine mobile format (e.g., 0917XXXXXXX or +63917XXXXXXX).",
      );
      return;
    }

    setIsSubmitting(true);

    const payload = {
      username: username.trim(),
      password: password,
      role: role,
      sub_role: subRole,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email_address: emailAddress.trim(),
      contact_number: contactNumber.trim(),
      badge_number: badgeNumber.trim(),
      agency_rank_title: agencyRankTitle.trim() || "Operator",
      department_division: departmentDivision.trim() || "Operations Division",
    };

    try {
      // const response = await axios.post("http://localhost:8081/create_user.php",
        const response = await axios.post("https://steadier-headscarf-maggot.ngrok-free.dev/create_user.php",
        payload,
        { headers: { "Content-Type": "application/json" } },
      );

      if (response.data.status === "success") {
        setMessageType("success");
        setMessage(`${username} successfully registered!`);
        setUsername("");
        setPassword("");
        setRole("officer");
        setSubRole("Evidence Collector / Forensic Technician");
        setFirstName("");
        setLastName("");
        setEmailAddress("");
        setContactNumber("");
        setBadgeNumber("");
        setAgencyRankTitle("");
        setDepartmentDivision("");
        fetchUsers();
      } else {
        setMessageType("error");
        setMessage(response.data.message || "Failed to finalize record.");
      }
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage(
        err.response?.data?.message || "Transaction aborted: Server offline.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user.id);
    setEditForm({
      username: user.username,
      password: "",
      role: user.role,
      subRole:
        user.sub_role ||
        user.subRole ||
        "Evidence Collector / Forensic Technician",
      firstName: user.firstName || user.first_name || "",
      lastName: user.lastName || user.last_name || "",
      emailAddress: user.emailAddress || user.email_address || "",
      contactNumber: user.contactNumber || user.contact_number || "",
      badgeNumber: user.badge_number || user.badgeNumber || "",
      agencyRankTitle: user.agency_rank_title || user.agencyRankTitle || "",
      departmentDivision:
        user.department_division || user.departmentDivision || "",
    });
  };

  const handleSaveEdit = async (id) => {
    if (!editForm.username.trim()) return alert("Username cannot be empty");

    // Strict verification checking for edit form channel updates
    if (!validatePHPhoneNumber(editForm.contactNumber)) {
      alert(
        "Invalid format! Use a valid Philippine mobile number format (e.g., 0917XXXXXXX or +63917XXXXXXX).",
      );
      return;
    }

    setIsSaving(true);
    try {
      // const response = await axios.post("http://localhost:8081/update_user.php",
        const response = await axios.post("https://steadier-headscarf-maggot.ngrok-free.dev/update_user.php",
        {
          id,
          username: editForm.username.trim(),
          password: editForm.password,
          role: editForm.role,
          sub_role: editForm.subRole,
          first_name: editForm.firstName || editForm.first_name,
          last_name: editForm.lastName || editForm.last_name,
          email_address: editForm.emailAddress || editForm.email_address,
          contact_number: editForm.contactNumber.trim(),
          badge_number: editForm.badgeNumber.trim(),
          agency_rank_title: editForm.agencyRankTitle.trim(),
          department_division: editForm.departmentDivision.trim(),
        },
        {
          headers: {
            "ngrok-skip-browser-warning": "ayakerrtssss",
          },
        },
      );

      if (response.data.status === "success") {
        setEditingUser(null);
        fetchUsers();
      } else {
        alert(response.data.message || "Failed to update operator profile");
      }
    } catch (err) {
      console.error("Network error saving operator details:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = (id, username) => {
    setUserTargetedForDeletion({ id, username });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userTargetedForDeletion) return;
    setIsDeleting(true);
    try {
      // const response = await axios.post("http://localhost:8081/delete_user.php",
        const response = await axios.post("https://steadier-headscarf-maggot.ngrok-free.dev/delete_user.php",
        {
          id: userTargetedForDeletion.id,
          status: "archived", // Targets archiving rather than deletion
        },
        {
          headers: {
            "ngrok-skip-browser-warning": "ayakerrtssss",
          },
        },
      );
      if (response.data.status === "success") {
        fetchUsers();
        setIsDeleteModalOpen(false);
        setUserTargetedForDeletion(null);
      } else {
        alert(response.data.message || "Failed to drop operator profile");
      }
    } catch (err) {
      console.error("Network error dropping database row:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle operational status between Active and Suspended states
  const handleToggleSuspension = async (id, currentStatus) => {
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    try {
      // const response = await axios.post("http://localhost:8081/delete_user.php",
        const response = await axios.post("https://steadier-headscarf-maggot.ngrok-free.dev/delete_user.php",
        {
          id: id,
          status: nextStatus,
        },
        {
          headers: {
            "ngrok-skip-browser-warning": "ayakerrtssss",
          },
        },
      );

      if (response.data.status === "success") {
        // Show a brief global success banner message
        setMessage(`Operator status successfully updated to ${nextStatus}.`);
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);

        // Refresh the database user directory table view automatically
        fetchUsers();
      } else {
        setMessage(response.data.message || "Failed to switch status.");
        setMessageType("error");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Network error toggling account suspension:", err);
      setMessage("A network transmission error occurred.");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Interdependent Directory Filter Processing Mechanism
  const handleFilterRoleChange = (selectedRole) => {
    setFilterRole(selectedRole);
    setFilterSubRole("all"); // Reset sub-role option choice to prevent conflicting values
    setCurrentPage(1); // Return query lookup matrix back to first page index
  };

  // Directory Search & Multi-Layer Custom Sorting Filter Pipeline
  const filteredUsers = usersList.filter((user) => {
    // 1. Keyword search rule match
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      searchLower === "" ||
      (user.username || "").toLowerCase().includes(searchLower) ||
      (user.firstName || user.first_name || "")
        .toLowerCase()
        .includes(searchLower) ||
      (user.lastName || user.last_name || "")
        .toLowerCase()
        .includes(searchLower) ||
      (user.emailAddress || user.email_address || "")
        .toLowerCase()
        .includes(searchLower);

    // 2. Position rule match
    const matchesRole = filterRole === "all" || user.role === filterRole;

    // 3. Operational sub-role match
    const userSubRole = user.sub_role || user.subRole || "";
    const matchesSubRole =
      filterSubRole === "all" || userSubRole === filterSubRole;

    // 4. Station assignment rule match
    const matchesAgency =
      filterAgency === "all" || user.department_division === filterAgency;

    // 5. Hierarchy rank title rule match
    const matchesRank =
      filterRank === "all" ||
      (filterRank === "civilian"
        ? !user.agency_rank_title
        : user.agency_rank_title === filterRank);

    // 6. Security account status rule match
    const currentStatus = user.account_status || "active";
    const matchesStatus =
      filterStatus === "all" || currentStatus === filterStatus;

    return (
      matchesSearch &&
      matchesRole &&
      matchesSubRole &&
      matchesAgency &&
      matchesRank &&
      matchesStatus
    );
  });

  // Pagination Slicing Coordinates based on the Active Filter Matrix
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1400px] 3xl:max-w-[1600px] mx-auto space-y-8 animate-fade-in px-4 sm:px-0">
      {/* HEADER TITLE ZONE */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Identity Access Management
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Provision and audit system operations access layers across
          architectural ecosystems.
        </p>
      </div>

      {/* CARD 1: ACCOUNT CONSTRUCTION FORM */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 sm:p-8 shadow-xl">
        <h3 className="text-base sm:text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          Provision New System Operator
        </h3>

        <form onSubmit={handleCreateUser} className="space-y-8">
          {/* SECTION 1: PERSONAL & CONTACT INFORMATION */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-wider text-blue-400 uppercase font-mono">
              Personal Identity & Contact
            </h4>
            <hr className="border-slate-800/60" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/30 transition-all text-sm"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Last name"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/30 transition-all text-sm"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="type"
                  placeholder="username@gmail.com"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/30 transition-all text-sm"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Contact Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., 09171234567"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/30 transition-all text-sm font-mono"
                  value={contactNumber}
                  onChange={(e) => handleContactNumberChange(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: ARCHITECTURAL ACCESS & LOG SECURITY */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-wider text-blue-400 uppercase font-mono">
              Authentication Credentials & Signature ID
            </h4>
            <hr className="border-slate-800/60" />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/30 transition-all text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/30 transition-all text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Badge / Institutional Serial Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., DET-2026-8841"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/30 transition-all text-sm font-mono"
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: ORGANIZATIONAL ROLES & AGENCY DEPLOYMENT */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-wider text-blue-400 uppercase font-mono">
              Authority & Agency Deployment
            </h4>
            <hr className="border-slate-800/60" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
              {/* POSITION SELECTOR */}
              <div className="w-full">
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Position
                </label>
                <div className="relative w-full">
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-slate-200 focus:ring-2 ring-blue-500/30 transition-all text-sm cursor-pointer appearance-none pr-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 1rem center",
                      backgroundSize: "1rem",
                    }}
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="officer">Officer</option>
                  </select>
                </div>
              </div>

              {/* OPERATIONAL SUB-ROLE SELECTOR */}
              <div className="w-full">
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Assigned Personnel
                </label>
                <div className="relative w-full">
                  <select
                    value={subRole}
                    onChange={(e) => setSubRole(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-slate-200 focus:ring-2 ring-blue-500/30 transition-all text-sm cursor-pointer appearance-none pr-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 1rem center",
                      backgroundSize: "1rem",
                    }}
                    required
                  >
                    {role === "admin" ? (
                      <option value="System Administrator">
                        System Administrator
                      </option>
                    ) : (
                      <>
                        <option value="Supervisor / Reviewer">
                          Supervisor
                        </option>
                        <option value="Auditor">Auditor</option>
                        <option value="Evidence Custodian">
                          Evidence Custodian
                        </option>
                        <option value="Evidence Collector / Forensic Technician">
                          Evidence Collector
                        </option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* AGENCY RANK INPUT */}
              <div className="w-full">
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Agency Rank / Title
                </label>
                <div className="relative w-full">
                  <select
                    value={agencyRankTitle}
                    onChange={(e) => setAgencyRankTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-slate-200 focus:ring-2 ring-blue-500/30 transition-all text-sm cursor-pointer appearance-none pr-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 1rem center",
                      backgroundSize: "1rem",
                    }}
                  >
                    <option value="">-- No Rank (Civilian Staff) --</option>
                    {PNP_RANKS.map((rank) => (
                      <option key={rank} value={rank}>
                        {rank}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DEPARTMENT DIVISION INPUT */}
              <div className="w-full">
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Division Assignment *
                </label>
                <div className="relative w-full">
                  <select
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/30 transition-all text-sm appearance-none pr-10 cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 1rem center",
                      backgroundSize: "1rem",
                    }}
                    value={departmentDivision}
                    onChange={(e) => setDepartmentDivision(e.target.value)}
                    required
                  >
                    <option value="" disabled className="text-slate-500">
                      {" "}
                      Select Station / Agency{" "}
                    </option>

                    {/* 1. Regional Headquaters / Specialized Taskforces Group */}
                    <optgroup
                      label="Specialized Units & Main Offices"
                      className="bg-slate-950 text-blue-400 font-bold text-xs"
                    >
                      {BENGUET_AGENCIES.filter(
                        (agency) => !agency.includes("Station "),
                      ).map((agency) => (
                        <option
                          key={agency}
                          value={agency}
                          className="bg-slate-900 text-white font-normal text-sm"
                        >
                          {agency}
                        </option>
                      ))}
                    </optgroup>

                    {/* 2. Numbered Local Police Precinct Stations Group */}
                    <optgroup
                      label="BCPO Numbered Precinct Stations"
                      className="bg-slate-950 text-amber-400 font-bold text-xs"
                    >
                      {BENGUET_AGENCIES.filter((agency) =>
                        agency.includes("Station "),
                      ).map((agency) => (
                        <option
                          key={agency}
                          value={agency}
                          className="bg-slate-900 text-white font-normal text-sm"
                        >
                          {agency}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SUBMIT ROW */}
          <div className="pt-4 border-t border-slate-800/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                // Instantly wipe all creation input state variables clean
                setUsername("");
                setPassword("");
                setFirstName("");
                setLastName("");
                setEmailAddress("");
                setContactNumber("");
                setBadgeNumber("");
                setAgencyRankTitle("");
                setDepartmentDivision("");
                setRole("officer");
                setSubRole("Evidence Collector / Forensic Technician");
              }}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700/80 active:bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-widest transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-center"
            >
              Clear Form
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all duration-200 shadow-lg active:scale-[0.98] text-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing Registry..." : "Register Operator"}
            </button>
          </div>
        </form>
      </div>

      {/* CARD 2: DIRECTORY REGISTER LIST */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-4 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-base sm:text-lg font-bold text-slate-200 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5 text-emerald-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            Active Operator Directory
          </h3>

          {/* REFRESH UTILITY CONTROL */}
          <button
            onClick={fetchUsers}
            className="self-end md:self-auto p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 border border-slate-800/60 rounded-xl transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className={`w-4 h-4 ${isLoadingUsers ? "animate-spin" : ""}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
        </div>

        {/* SEARCH AND CONTROL DROPDOWN FILTERS PANEL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {/* SEARCH BY KEYWORD INPUT */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search name, user, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-1 ring-blue-500/50 text-xs transition-all"
            />
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z"
                />
              </svg>
            </div>
          </div>

          {/* FILTER BY POSITION SELECT */}
          <div className="relative w-full">
            <select
              value={filterRole}
              onChange={(e) => handleFilterRoleChange(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-slate-300 text-xs cursor-pointer appearance-none focus:ring-1 ring-blue-500/50"
            >
              <option value="all">All Positions</option>
              <option value="admin">Admin Only</option>
              <option value="officer">Officer Only</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
          </div>

          {/* FILTER BY SUB-ROLE SELECT */}
          <div className="relative w-full">
            <select
              value={filterSubRole}
              onChange={(e) => {
                setFilterSubRole(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-slate-300 text-xs cursor-pointer appearance-none focus:ring-1 ring-blue-500/50"
            >
              <option value="all">All Sub-Roles</option>
              {filterRole === "admin" ? (
                <option value="System Administrator">
                  System Administrator
                </option>
              ) : filterRole === "officer" ? (
                <>
                  <option value="Supervisor / Reviewer">
                    Supervisor / Reviewer
                  </option>
                  <option value="Auditor">Auditor</option>
                  <option value="Evidence Custodian">Evidence Custodian</option>
                  <option value="Evidence Collector / Forensic Technician">
                    Evidence Collector / Forensic Technician
                  </option>
                </>
              ) : (
                <>
                  <option value="System Administrator">
                    System Administrator
                  </option>
                  <option value="Supervisor / Reviewer">
                    Supervisor / Reviewer
                  </option>
                  <option value="Auditor">Auditor</option>
                  <option value="Evidence Custodian">Evidence Custodian</option>
                  <option value="Evidence Collector / Forensic Technician">
                    Evidence Collector / Forensic Technician
                  </option>
                </>
              )}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
          </div>

          {/* FILTER BY AGENCY / STATION */}
          <div className="relative w-full">
            <select
              value={filterAgency || "all"}
              onChange={(e) => {
                setFilterAgency(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-slate-300 text-xs cursor-pointer appearance-none focus:ring-1 ring-blue-500/50"
            >
              <option value="all">All Stations</option>
              <option value="Baguio City Police Office (BCPO) - Main">
                BCPO - Main
              </option>
              <option value="Benguet Provincial Police Office (BPPO) - Camp Dangwa">
                BPPO - Camp Dangwa
              </option>
              <option value="National Bureau of Investigation - Cordillera (NBI-CAR)">
                NBI-CAR
              </option>
              <option value="PDEA - Cordillera Administrative Region (PDEA-CAR)">
                PDEA-CAR
              </option>
              <option value="CIDG - Benguet Provincial Field Unit">
                CIDG Benguet
              </option>
              <option value="PNP Forensic Group - Regional Forensic Unit (RFU-CAR)">
                RFU-CAR
              </option>
              <option value="La Trinidad Municipal Police Station (LTMPS)">
                LTMPS
              </option>
              <option value="BCPO - Station 1 (Naguilian)">
                BCPO - Station 1
              </option>
              <option value="BCPO - Station 2 (Camdas)">
                BCPO - Station 2
              </option>
              <option value="BCPO - Station 3 (Pacdal)">
                BCPO - Station 3
              </option>
              <option value="BCPO - Station 4 (Loakan)">
                BCPO - Station 4
              </option>
              <option value="BCPO - Station 5 (Legarda)">
                BCPO - Station 5
              </option>
              <option value="BCPO - Station 6 (Aurora Hill)">
                BCPO - Station 6
              </option>
              <option value="BCPO - Station 7 (Abanao)">
                BCPO - Station 7
              </option>
              <option value="BCPO - Station 8 (Kennon)">
                BCPO - Station 8
              </option>
              <option value="BCPO - Station 9 (Irisan)">
                BCPO - Station 9
              </option>
              <option value="BCPO - Station 10 (Marcos Highway)">
                BCPO - Station 10
              </option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
          </div>

          {/* FILTER BY RANK / TITLE */}
          <div className="relative w-full">
            <select
              value={filterRank || "all"}
              onChange={(e) => {
                setFilterRank(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-slate-300 text-xs cursor-pointer appearance-none focus:ring-1 ring-blue-500/50"
            >
              <option value="all">All Ranks</option>
              <option value="PCOL">PCOL</option>
              <option value="PLTCOL">PLTCOL</option>
              <option value="PMAJ">PMAJ</option>
              <option value="PCPT">PCPT</option>
              <option value="PLT">PLT</option>
              <option value="PEMS">PEMS</option>
              <option value="PCMS">PCMS</option>
              <option value="PMSg">PMSg</option>
              <option value="PSSg">PSSg</option>
              <option value="PCpl">PCpl</option>
              <option value="Pat">Pat</option>
              <option value="civilian">Civilian Staff</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
          </div>

          {/* FILTER BY ACCOUNT STATUS */}
          <div className="relative w-full">
            <select
              value={filterStatus || "all"}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-slate-300 text-xs cursor-pointer appearance-none focus:ring-1 ring-blue-500/50"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="archived">Archived Only</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
          </div>
        </div>

        {isLoadingUsers ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs tracking-wider">
            Querying database registry pipelines...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs tracking-wider border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
            No active operator records match the selected filter criteria.
          </div>
        ) : (
          <div className="space-y-4">
            {/* TABLE CONTAINER WINDOW LAYER WITH DARK SYSTEM BACKGROUND SCROLLBARS */}
            <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-xl">
              <table className="w-full border-collapse text-left text-sm min-w-[1200px]">
                <thead className="bg-slate-900 border-b border-slate-800 font-mono uppercase text-slate-400 text-xs tracking-wider">
                  <tr>
                    <th className="px-5 py-4 font-bold">Username</th>
                    <th className="px-5 py-4 font-bold">Full Name</th>
                    <th className="px-5 py-4 font-bold">Email Address</th>
                    <th className="px-5 py-4 font-bold">Contact</th>
                    <th className="px-5 py-4 font-bold">Security Key</th>
                    <th className="px-5 py-4 font-bold">Access Layer</th>
                    <th className="px-5 py-4 font-bold">Sub-Role</th>
                    <th className="px-5 py-4 font-bold">Status</th>
                    <th className="px-5 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {currentUsers.map((user) => {
                    const isCurrentEditRow = editingUser === user.id;
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-900/20 transition-colors"
                      >
                        {/* Username */}
                        <td className="px-5 py-4 text-slate-200 font-semibold">
                          {isCurrentEditRow ? (
                            <input
                              type="text"
                              value={editForm.username || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  username: e.target.value,
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:outline-none"
                            />
                          ) : (
                            <div className="flex flex-col">
                              <span>{user.username}</span>
                              {user.agency_rank_title && (
                                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-0.5">
                                  Rank: {user.agency_rank_title}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Full Name */}
                        <td className="px-5 py-4 text-slate-300">
                          {isCurrentEditRow ? (
                            <div className="flex gap-2 min-w-[160px]">
                              <input
                                type="text"
                                value={
                                  editForm.firstName ||
                                  editForm.first_name ||
                                  ""
                                }
                                placeholder="First"
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    firstName: e.target.value,
                                  })
                                }
                                className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:outline-none"
                              />
                              <input
                                type="text"
                                value={
                                  editForm.lastName || editForm.last_name || ""
                                }
                                placeholder="Last"
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    lastName: e.target.value,
                                  })
                                }
                                className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:outline-none"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span>{`${user.firstName || user.first_name || ""} ${user.lastName || user.last_name || ""}`}</span>
                              {user.department_division && (
                                <span className="text-[10px] text-blue-400/80 font-medium truncate max-w-[220px] mt-0.5">
                                  {user.department_division}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Email */}
                        <td className="px-5 py-4 text-slate-300">
                          {isCurrentEditRow ? (
                            <input
                              type="email"
                              value={
                                editForm.emailAddress ||
                                editForm.email_address ||
                                ""
                              }
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  emailAddress: e.target.value,
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:outline-none"
                            />
                          ) : (
                            user.emailAddress || user.email_address
                          )}
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4 text-slate-300 font-mono text-xs">
                          {isCurrentEditRow ? (
                            <input
                              type="text"
                              value={
                                editForm.contactNumber ||
                                editForm.contact_number ||
                                ""
                              }
                              onChange={(e) =>
                                handleEditContactNumberChange(e.target.value)
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:outline-none"
                            />
                          ) : (
                            user.contactNumber || user.contact_number
                          )}
                        </td>

                        {/* Password / Security Key */}
                        <td className="px-5 py-4 font-mono text-slate-500 text-xs tracking-widest">
                          {isCurrentEditRow ? (
                            <input
                              type="password"
                              placeholder="Unmodified if blank"
                              value={editForm.password || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  password: e.target.value,
                                })
                              }
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs w-full tracking-normal focus:outline-none"
                            />
                          ) : (
                            "••••••••"
                          )}
                        </td>

                        {/* Access Layer / Role */}
                        <td className="px-5 py-4">
                          {isCurrentEditRow ? (
                            <select
                              value={editForm.role || ""}
                              onChange={(e) =>
                                handleEditRoleChange(e.target.value)
                              }
                              className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-1 text-xs focus:outline-none cursor-pointer"
                            >
                              <option value="admin">Admin</option>
                              <option value="officer">Officer</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-block px-2 py-0.5 text-[10px] font-mono tracking-wider font-bold uppercase rounded border ${user.role === "admin" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-sky-400 bg-sky-500/10 border-sky-500/20"}`}
                            >
                              {user.role}
                            </span>
                          )}
                        </td>

                        {/* Detailed Sub Role */}
                        <td className="px-5 py-4 text-slate-300">
                          {isCurrentEditRow ? (
                            <select
                              value={editForm.subRole || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  subRole: e.target.value,
                                })
                              }
                              disabled={editForm.role === "admin"}
                              className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-1 text-xs w-full focus:outline-none cursor-pointer"
                            >
                              {editForm.role === "admin" ? (
                                <option value="System Administrator">
                                  System Administrator
                                </option>
                              ) : (
                                <>
                                  <option value="Supervisor / Reviewer">
                                    Supervisor / Reviewer
                                  </option>
                                  <option value="Auditor">Auditor</option>
                                  <option value="Evidence Custodian">
                                    Evidence Custodian
                                  </option>
                                  <option value="Evidence Collector / Forensic Technician">
                                    Evidence Collector / Forensic Technician
                                  </option>
                                </>
                              )}
                            </select>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">
                              {user.sub_role || user.subRole}
                            </span>
                          )}
                        </td>

                        {/* Account Status Badge */}
                        <td className="px-5 py-4 font-mono text-xs">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] tracking-wider font-bold uppercase rounded border ${
                              user.account_status === "active"
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : user.account_status === "suspended"
                                  ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
                                  : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                            }`}
                          >
                            {user.account_status || "active"}
                          </span>
                        </td>

                        {/* Control Actions */}
                        <td className="px-5 py-4 text-right whitespace-nowrap text-xs font-medium space-x-2">
                          {isCurrentEditRow ? (
                            <>
                              <button
                                disabled={isSaving}
                                onClick={() => handleSaveEdit(user.id)}
                                className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-all"
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="text-slate-400 hover:text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition-all"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {user.account_status === "archived" ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-xs font-mono font-semibold text-slate-500 italic pr-2 select-none">
                                    Locked / Archived
                                  </span>
                                  <button
                                    onClick={() => handleViewClick(user)}
                                    className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-all"
                                  >
                                    View
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleViewClick(user)}
                                    className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-all"
                                  >
                                    View
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleToggleSuspension(
                                        user.id,
                                        user.account_status,
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-lg border transition-all ${
                                      user.account_status === "suspended"
                                        ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
                                        : "text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20"
                                    }`}
                                  >
                                    {user.account_status === "suspended"
                                      ? "Lift Suspension"
                                      : "Suspend"}
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleDeleteUser(user.id, user.username)
                                    }
                                    className="text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-all"
                                  >
                                    Archive
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* DIRECTORY PAGINATION INTERACTIVE PANELS CONTROL ROW */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-4">
                <p className="text-xs font-mono text-slate-400">
                  Showing{" "}
                  <span className="text-slate-200 font-bold">
                    {indexOfFirstItem + 1}
                  </span>{" "}
                  to{" "}
                  <span className="text-slate-200 font-bold">
                    {indexOfLastItem > filteredUsers.length
                      ? filteredUsers.length
                      : indexOfLastItem}
                  </span>{" "}
                  of{" "}
                  <span className="text-slate-200 font-bold">
                    {filteredUsers.length}
                  </span>{" "}
                  registry indices
                </p>

                <div className="flex items-center gap-1.5">
                  {/* Previous Action Trigger */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800/80 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 19.5L8.25 12l7.5-7.5"
                      />
                    </svg>
                  </button>

                  {/* Page Numerical Matrix Indexes */}
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-[36px] h-[36px] font-mono text-xs font-bold rounded-xl border transition-all ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-blue-600 to-sky-600 border-blue-500 text-white shadow-md shadow-blue-500/10"
                            : "bg-slate-950 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ),
                  )}

                  {/* Next Action Trigger */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800/80 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GLOBAL ALERTS PORTALS */}
      {message && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce w-full max-w-sm px-4">
          <div
            className={`backdrop-blur-md border px-4 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 transition-all ${messageType === "success" ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300" : "bg-rose-950/80 border-rose-500/30 text-rose-300"}`}
          >
            <span>{messageType === "success" ? "✅" : "⚠️"}</span>
            <p className="font-sans font-medium text-xs tracking-wide">
              {message}
            </p>
          </div>
        </div>
      )}

      {/* GLASSMORPHIC OPERATOR PROFILE PREVIEW MODAL */}
      {isViewModalOpen &&
        viewingUser &&
        (() => {
          // Check if this specific user is the one undergoing modifications
          const isModalEditing = editingUser === viewingUser.id;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-950/60 animate-fade-in">
              <div className="relative w-full max-w-2xl overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl transition-all">
                {/* Visual Accent Header Ring Decor */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-sky-500" />

                {/* Main Content Space */}
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Header Block Section */}
                  <div className="flex flex-col-reverse sm:flex-row justify-between items-start gap-4">
                    <div className="w-full sm:w-auto">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-mono tracking-wider font-bold uppercase rounded border mb-2 ${
                          (isModalEditing
                            ? editForm.role
                            : viewingUser.role) === "admin"
                            ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                            : "text-sky-400 bg-sky-500/10 border-sky-500/20"
                        }`}
                      >
                        {isModalEditing ? editForm.role : viewingUser.role}{" "}
                        Layer
                      </span>

                      {isModalEditing ? (
                        <div className="space-y-2 max-w-sm">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="First Name"
                              value={
                                editForm.firstName || editForm.first_name || ""
                              }
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  firstName: e.target.value,
                                  first_name: e.target.value,
                                })
                              }
                              className="w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Last Name"
                              value={
                                editForm.lastName || editForm.last_name || ""
                              }
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  lastName: e.target.value,
                                  last_name: e.target.value,
                                })
                              }
                              className="w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none"
                            />
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                              @
                            </span>
                            <input
                              type="text"
                              placeholder="username"
                              value={editForm.username || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  username: e.target.value,
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-1.5 text-white text-xs font-mono focus:outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {viewingUser.firstName ||
                              viewingUser.first_name ||
                              ""}{" "}
                            {viewingUser.lastName ||
                              viewingUser.last_name ||
                              ""}
                          </h3>
                          <p className="text-slate-400 font-mono text-xs mt-1">
                            @{viewingUser.username}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Top-Right Responsive Image Avatar Placeholder */}
                    <div className="self-end sm:self-auto flex-shrink-0 relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-600 font-mono text-[10px] tracking-widest uppercase overflow-hidden">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-8 h-8 text-slate-500 mb-1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                          />
                        </svg>
                        <span>No Image</span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-800/80" />

                  {/* Informational Data Layout Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs sm:text-sm">
                    {/* Email Address */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 mb-0.5">
                        Email Address
                      </label>
                      {isModalEditing ? (
                        <input
                          type="email"
                          value={
                            editForm.emailAddress ||
                            editForm.email_address ||
                            ""
                          }
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              emailAddress: e.target.value,
                              email_address: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none"
                        />
                      ) : (
                        <p className="text-slate-200 truncate font-medium">
                          {viewingUser.emailAddress ||
                            viewingUser.email_address ||
                            "N/A"}
                        </p>
                      )}
                    </div>

                    {/* Contact Line */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 mb-0.5">
                        Contact Line
                      </label>
                      {isModalEditing ? (
                        <input
                          type="text"
                          value={
                            editForm.contactNumber ||
                            editForm.contact_number ||
                            ""
                          }
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              contactNumber: e.target.value,
                              contact_number: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs font-mono focus:outline-none"
                        />
                      ) : (
                        <p className="text-slate-200 font-mono font-medium">
                          {viewingUser.contactNumber ||
                            viewingUser.contact_number ||
                            "N/A"}
                        </p>
                      )}
                    </div>

                    {/* Security Core Key Modification Parameters */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 mb-0.5">
                        Security Access Key / Password
                      </label>
                      {isModalEditing ? (
                        <input
                          type="password"
                          placeholder="Unmodified if blank"
                          value={editForm.password || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              password: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs tracking-normal focus:outline-none"
                        />
                      ) : (
                        <p className="text-slate-500 font-mono tracking-widest font-medium">
                          ••••••••
                        </p>
                      )}
                    </div>

                    {/* Access Level Authorization Controls */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 mb-0.5">
                        Account System Layer Role
                      </label>
                      {isModalEditing ? (
                        <select
                          value={editForm.role || ""}
                          onChange={(e) => {
                            const nextRole = e.target.value;
                            setEditForm({
                              ...editForm,
                              role: nextRole,
                              subRole:
                                nextRole === "admin"
                                  ? "System Administrator"
                                  : "Supervisor / Reviewer",
                              sub_role:
                                nextRole === "admin"
                                  ? "System Administrator"
                                  : "Supervisor / Reviewer",
                            });
                          }}
                          className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="admin">Admin</option>
                          <option value="officer">Officer</option>
                        </select>
                      ) : (
                        <p className="text-slate-200 font-medium capitalize">
                          {viewingUser.role || "—"}
                        </p>
                      )}
                    </div>

                    {/* Designated Assignment Sub-Role */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 mb-0.5">
                        Designated Assignment Sub-Role
                      </label>
                      {isModalEditing ? (
                        <select
                          value={editForm.subRole || editForm.sub_role || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              subRole: e.target.value,
                              sub_role: e.target.value,
                            })
                          }
                          disabled={editForm.role === "admin"}
                          className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none cursor-pointer disabled:opacity-50"
                        >
                          {editForm.role === "admin" ? (
                            <option value="System Administrator">
                              System Administrator
                            </option>
                          ) : (
                            <>
                              <option value="Supervisor / Reviewer">
                                Supervisor / Reviewer
                              </option>
                              <option value="Auditor">Auditor</option>
                              <option value="Evidence Custodian">
                                Evidence Custodian
                              </option>
                              <option value="Evidence Collector / Forensic Technician">
                                Evidence Collector / Forensic Technician
                              </option>
                            </>
                          )}
                        </select>
                      ) : (
                        <p className="text-emerald-400 font-semibold">
                          {viewingUser.sub_role || viewingUser.subRole || "N/A"}
                        </p>
                      )}
                    </div>

                    {/* Badge Serial Registry ID */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 mb-0.5">
                        Badge Serial Registry ID
                      </label>
                      {isModalEditing ? (
                        <input
                          type="text"
                          value={
                            editForm.badgeNumber || editForm.badge_number || ""
                          }
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              badgeNumber: e.target.value,
                              badge_number: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs font-mono focus:outline-none"
                        />
                      ) : (
                        <p className="text-slate-200 font-mono font-medium">
                          {viewingUser.badge_number ||
                            viewingUser.badgeNumber ||
                            "—"}
                        </p>
                      )}
                    </div>

                    {/* Rank Designation / Title */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 mb-0.5">
                        Rank Designation / Title
                      </label>
                      {isModalEditing ? (
                        <div className="relative w-full">
                          <select
                            value={
                              editForm.agencyRankTitle ||
                              editForm.agency_rank_title ||
                              ""
                            }
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                agencyRankTitle: e.target.value,
                                agency_rank_title: e.target.value,
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none cursor-pointer appearance-none pr-8"
                            style={{
                              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 0.75rem center",
                              backgroundSize: "0.9rem",
                            }}
                          >
                            <option value=""> No Rank (Civilian) </option>
                            {(typeof PNP_RANKS !== "undefined"
                              ? PNP_RANKS
                              : [
                                  "PCOL",
                                  "PLTCOL",
                                  "PMAJ",
                                  "PCPT",
                                  "PLT",
                                  "PEMS",
                                  "PCMS",
                                  "PMSg",
                                  "PSSg",
                                  "PCpl",
                                  "Pat",
                                ]
                            ).map((rank) => (
                              <option
                                key={rank}
                                value={rank}
                                className="bg-slate-900 text-white"
                              >
                                {rank}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <p className="text-slate-200 font-medium">
                          {viewingUser.agency_rank_title ||
                            viewingUser.agencyRankTitle ||
                            "Civilian"}
                        </p>
                      )}
                    </div>

                    {/* Division / Department Dropdown mapping regional targets */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 mb-0.5">
                        Division / Department
                      </label>
                      {isModalEditing ? (
                        <select
                          value={
                            editForm.departmentDivision ||
                            editForm.department_division ||
                            ""
                          }
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              departmentDivision: e.target.value,
                              department_division: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="" className="text-slate-500">
                            -- No Station Assignment --
                          </option>

                          {/* 1. Regional Headquarters / Specialized Taskforces Group */}
                          <optgroup
                            label="Specialized Units & Main Offices"
                            className="bg-slate-950 text-blue-400 font-bold text-[11px]"
                          >
                            {BENGUET_AGENCIES.filter(
                              (agency) => !agency.includes("Station "),
                            ).map((agency) => (
                              <option
                                key={agency}
                                value={agency}
                                className="bg-slate-900 text-slate-200 font-normal text-xs"
                              >
                                {agency}
                              </option>
                            ))}
                          </optgroup>

                          {/* 2. Numbered Local Police Precinct Stations Group */}
                          <optgroup
                            label="BCPO Numbered Precinct Stations"
                            className="bg-slate-950 text-amber-400 font-bold text-[11px]"
                          >
                            {BENGUET_AGENCIES.filter((agency) =>
                              agency.includes("Station "),
                            ).map((agency) => (
                              <option
                                key={agency}
                                value={agency}
                                className="bg-slate-900 text-slate-200 font-normal text-xs"
                              >
                                {agency}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      ) : (
                        <p className="text-slate-200 font-medium">
                          {viewingUser.department_division ||
                            viewingUser.departmentDivision ||
                            "—"}
                        </p>
                      )}
                    </div>

                    {/* Account Status Signature */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 mb-0.5">
                        Account Status Signature
                      </label>
                      {isModalEditing ? (
                        <select
                          value={
                            editForm.account_status ||
                            editForm.accountStatus ||
                            "active"
                          }
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              account_status: e.target.value,
                              accountStatus: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="archived">Archived</option>
                        </select>
                      ) : (
                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded border mt-1 ${
                              viewingUser.account_status === "active" ||
                              !viewingUser.account_status
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : viewingUser.account_status === "suspended"
                                  ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
                                  : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                            }`}
                          >
                            {viewingUser.account_status || "active"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions Row */}
                  <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-800/80">
                    {isModalEditing ? (
                      <>
                        <button
                          disabled={isSaving}
                          onClick={async () => {
                            // Execute update save function
                            await handleSaveEdit(viewingUser.id);

                            // Synthetically update view component's state representation with the form details safely utilizing mirrored variations
                            setViewingUser({
                              ...viewingUser,
                              username: editForm.username,
                              firstName: editForm.firstName,
                              first_name: editForm.firstName,
                              lastName: editForm.lastName,
                              last_name: editForm.lastName,
                              emailAddress: editForm.emailAddress,
                              email_address: editForm.emailAddress,
                              contactNumber: editForm.contactNumber,
                              contact_number: editForm.contactNumber,
                              role: editForm.role,
                              subRole: editForm.subRole,
                              sub_role: editForm.subRole,
                              badgeNumber: editForm.badgeNumber,
                              badge_number: editForm.badgeNumber,
                              agencyRankTitle: editForm.agencyRankTitle,
                              agency_rank_title: editForm.agencyRankTitle,
                              departmentDivision: editForm.departmentDivision,
                              department_division: editForm.departmentDivision,
                              account_status: editForm.account_status,
                              accountStatus: editForm.account_status,
                            });
                          }}
                          className="w-full sm:w-auto text-center font-semibold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-5 py-2 rounded-xl transition-all text-xs tracking-wide"
                        >
                          {isSaving
                            ? "Saving Modifications..."
                            : "Save Changes"}
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="w-full sm:w-auto text-center font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-5 py-2 rounded-xl transition-all text-xs tracking-wide"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {viewingUser.account_status !== "archived" && (
                          <button
                            onClick={() => handleEditClick(viewingUser)}
                            className="w-full sm:w-auto text-center font-semibold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-5 py-2 rounded-xl transition-all text-xs tracking-wide"
                          >
                            Edit Profile
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setIsViewModalOpen(false);
                            setViewingUser(null);
                          }}
                          className="w-full sm:w-auto text-center font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-5 py-2 rounded-xl transition-all text-xs tracking-wide"
                        >
                          Close Window
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      <DeleteModal
        isOpen={isDeleteModalOpen}
        isDeleting={isDeleting}
        username={userTargetedForDeletion?.username}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
      <EvidentiaFooter />
    </div>
  );
}
