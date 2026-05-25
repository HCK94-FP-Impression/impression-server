const buildCriteriaBreakdown = (criteria = [], ratings = []) => {
  // Pisah ratings berdasarkan tipe
  const socialRatings = ratings.filter((r) => r.ratingType === "social");
  const professionalRatings = ratings.filter(
    (r) =>
      r.ratingType === "professional_recruiter" ||
      r.ratingType === "professional_same_job",
  );

  // Hitung rata-rata per criteria untuk satu segmen
  const calculateAverage = (segmentRatings) => {
    return criteria.map((label, index) => {
      const values = segmentRatings
        .map((r) => r.scores[index])
        .filter((score) => Number.isFinite(score));

      const average =
        values.length > 0
          ? values.reduce((sum, val) => sum + val, 0) / values.length
          : 0;

      return {
        label,
        average: Number(average.toFixed(2)),
        maxScore: 3,
      };
    });
  };

  return {
    social: calculateAverage(socialRatings),
    professional: calculateAverage(professionalRatings),
  };
};

module.exports = { buildCriteriaBreakdown };
