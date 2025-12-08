import React, { useState } from "react";
import Rating from "./Rating";
import api from "../api/client";

const Review = ({ productId, canReview }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!canReview) {
      setError("You can only rate or comment after the product is delivered.");
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5.");
      return;
    }
    if (!comment.trim()) {
      setError("Please enter a comment.");
      return;
    }
    try {
      setSubmitting(true);
      const ratingRes = await api.post(
        `/api/products/${productId}/rating`,
        { rating },
        { validateStatus: () => true }
      );
      if (ratingRes.status < 200 || ratingRes.status >= 300) {
        setError(ratingRes.data?.message || "Failed to submit rating.");
        setSubmitting(false);
        return;
      }

      const commentRes = await api.post(
        `/api/products/${productId}/comment`,
        { comment },
        { validateStatus: () => true }
      );
      if (commentRes.status < 200 || commentRes.status >= 300) {
        setError(commentRes.data?.message || "Failed to submit comment.");
        setSubmitting(false);
        return;
      }

      setMessage("Rating submitted and comment sent for approval.");
      setComment("");
      setRating(0);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-form">
      <div className="review-title">
        <h5>Add a Review</h5>
      </div>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form className="row" onSubmit={handleSubmit}>
        <div className="col-md-4 col-12">
          <div className="rating">
            <span className="rating-title">Your Rating (1-5): </span>
            <input
              type="number"
              min="1"
              max="5"
              className="form-control"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="col-md-8 col-12">
          <textarea
            rows="4"
            type="text"
            name="message"
            placeholder="Type your comment (will be shown after manager approval)"
            className="form-control"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>
        <div className="col-12 mt-2">
          <button className="default-button" type="submit" disabled={submitting}>
            <span>{submitting ? "Submitting..." : "Submit Review"}</span>
          </button>
          {!canReview && (
            <p style={{ color: "#777", marginTop: "6px" }}>
              You need a delivered order for this product before rating or commenting.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Review;
