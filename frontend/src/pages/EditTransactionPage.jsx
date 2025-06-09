import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditTransactionPage()
{
    const {id} = useParams()
    const navigate = UseNavigate()
    const [form, setForm] = useState({amount: "", category: "", description: ""});
    const [loading, setLoading] = useState(true);

}