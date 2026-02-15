/**
 * CourseFeedbackForm Component
 * ----------------------------------------
 * Dynamic feedback form that renders objective and subjective questions
 * based on selected feedback type.
 *
 * Features:
 * - API-driven question rendering
 * - Objective & subjective validation
 * - Async submission handling
 * - Loading & error states
 * - Clean UX with MUI components
 */

import React, { useState, useEffect } from "react";
import {
  TextField,
  Radio,
  FormControlLabel,
  RadioGroup,
  Grid,
  Typography,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import { fetchData, postData } from "../../../../utils/apiUtils";
import { formatDate } from "../../../../utils/functions";

const CourseFeedbackForm = ({
  student,
  studentPrn,
  selectedFeedback,
  displaySnackbar,
  setSelectedFeedback,
  fetchFeedbacks,
  centreId,
}) => {
  const [formData, setFormData] = useState({});
  const [objectiveQuestions, setObjectiveQuestions] = useState([]);
  const [subjectiveQuestions, setSubjectiveQuestions] = useState([]);
  const [objectiveAnswers, setObjectiveAnswers] = useState([]);
  const [subjectiveAnswers, setSubjectiveAnswers] = useState([]);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const feedbackTypeId = selectedFeedback?.feedback_type_id;

  // Populate student metadata
  useEffect(() => {
    if (student) {
      setFormData({
        trainingName: student?.trng_name || "",
        batchName: student?.batch_name || "",
        centreName: student?.centre_name || "",
        startDate: formatDate(student?.batch_start_date) || "",
        endDate: formatDate(student?.batch_end_date) || "",
      });
    }
  }, [student]);

  // Fetch feedback questions
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!feedbackTypeId) return;

      setLoading(true);
      try {
        const response = await fetchData("/feedback/feedback_question", {
          feedbackTypeId,
          centre_id: centreId,
        });

        if (response?.success) {
          setObjectiveQuestions(response?.data?.objectiveQuestions || []);
          setSubjectiveQuestions(response?.data?.subjectiveQuestions || []);
        } else {
          setError("Failed to load questions.");
        }
      } catch {
        setError("Unable to connect to server. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [feedbackTypeId, centreId]);

  // Handle objective answer change
  const handleAnswerChange = (questionId, value) => {
    const updatedAnswers = [...objectiveAnswers];
    const existingIndex = updatedAnswers.findIndex(
      (ans) => ans.question_id === questionId
    );

    if (existingIndex !== -1) {
      updatedAnswers[existingIndex].option_id = value;
    } else {
      updatedAnswers.push({ question_id: questionId, option_id: value });
    }

    setObjectiveAnswers(updatedAnswers);
    setValidationErrors((prev) => ({ ...prev, [questionId]: false }));
  };

  // Handle subjective answer change
  const handleSubjectiveAnswerChange = (questionId, value) => {
    setSubjectiveAnswers((prev) => {
      const existing = prev.find((a) => a.question_id === questionId);

      if (existing) {
        return prev.map((a) =>
          a.question_id === questionId ? { ...a, answer: value } : a
        );
      }

      return [...prev, { question_id: questionId, answer: value }];
    });

    setValidationErrors((prev) => ({
      ...prev,
      [questionId]: !value.trim(),
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    const allObjectiveAnswered = objectiveQuestions.every((question) =>
      objectiveAnswers.find((a) => a.question_id === question.question_id)
    );

    const allSubjectiveAnswered = subjectiveQuestions.every((question) => {
      const ans = subjectiveAnswers.find(
        (a) => a.question_id === question.question_id
      );
      return ans && ans.answer?.trim();
    });

    if (!allObjectiveAnswered || !allSubjectiveAnswered) {
      displaySnackbar("info", "Please answer all required questions.");
      return;
    }

    const feedbackData = objectiveQuestions.map((question) => ({
      feedback_id: selectedFeedback?.feedback_id,
      student_prn: studentPrn,
      question_id: question.question_id,
      option_id: objectiveAnswers.find(
        (a) => a.question_id === question.question_id
      )?.option_id,
      updated_by: studentPrn,
    }));

    const subjectiveFeedbackData = subjectiveQuestions.map((question) => ({
      feedback_id: selectedFeedback?.feedback_id,
      student_prn: studentPrn,
      question_id: question.question_id,
      answer: subjectiveAnswers.find(
        (a) => a.question_id === question.question_id
      )?.answer,
      updated_by: studentPrn,
    }));

    const payload = {
      feedbackData,
      subjectiveFeedbackData,
      feedbackSubmission: {
        feedback_id: selectedFeedback?.feedback_id,
        student_prn: studentPrn,
        has_submitted: 1,
      },
      feedbackSuggestion: comments
        ? {
            feedback_id: selectedFeedback?.feedback_id,
            student_prn: studentPrn,
            suggestion: comments.trim(),
            suggestion_is_valid: 1,
            updated_by: studentPrn,
          }
        : {},
    };

    try {
      setProcessing(true);
      const response = await postData("/feedback/feedback/submit", payload);

      if (response?.success) {
        setObjectiveAnswers([]);
        setSubjectiveAnswers([]);
        setComments("");
        displaySnackbar("success", "Feedback submitted successfully!");
        setSelectedFeedback(null);
      } else {
        displaySnackbar("error", "Submission failed.");
      }
    } catch {
      displaySnackbar("error", "Failed to submit feedback.");
    } finally {
      setProcessing(false);
      fetchFeedbacks();
    }
  };

  const handleBackClick = () => {
    setSelectedFeedback(null);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Button variant="outlined" onClick={handleBackClick}>
        Back
      </Button>

      <Typography variant="h5" gutterBottom mt={2}>
        {selectedFeedback?.feedback_type_name}
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Divider sx={{ my: 3 }} />

          {/* Objective Questions */}
          {objectiveQuestions.map((question, index) => (
            <Box key={question.question_id} mb={3}>
              <Typography fontWeight="bold">
                {index + 1}. {question.question_text}
              </Typography>

              <RadioGroup
                value={
                  objectiveAnswers.find(
                    (a) => a.question_id === question.question_id
                  )?.option_id || ""
                }
                onChange={(e) =>
                  handleAnswerChange(question.question_id, e.target.value)
                }
              >
                {question?.options?.map((option) => (
                  <FormControlLabel
                    key={option.option_id}
                    value={option.option_id}
                    control={<Radio />}
                    label={option.option_value}
                  />
                ))}
              </RadioGroup>
            </Box>
          ))}

          <Divider sx={{ my: 3 }} />

          {/* Subjective Questions */}
          {subjectiveQuestions.map((question, index) => (
            <Box key={question.question_id} mb={3}>
              <Typography fontWeight="bold">
                {objectiveQuestions.length + index + 1}.{" "}
                {question.question_text}
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                value={
                  subjectiveAnswers.find(
                    (a) => a.question_id === question.question_id
                  )?.answer || ""
                }
                onChange={(e) =>
                  handleSubjectiveAnswerChange(
                    question.question_id,
                    e.target.value
                  )
                }
              />
            </Box>
          ))}

          <Divider sx={{ my: 3 }} />

          <TextField
            label="Additional Comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            fullWidth
            multiline
            rows={4}
            inputProps={{ maxLength: 500 }}
          />

          <Box textAlign="right" mt={3}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={processing}
            >
              {processing ? "Submitting..." : "Submit"}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default CourseFeedbackForm;
