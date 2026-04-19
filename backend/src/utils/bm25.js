class BM25 {
  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
    this.avgDocLength = 0;
    this.docCount = 0;
    this.idf = {};
  }

  addDocument(doc) {
    const tokens = this.tokenize(doc);
    this.docCount++;
    this.avgDocLength += tokens.length;

    const uniqueTokens = new Set(tokens);
    for (const token of uniqueTokens) {
      this.idf[token] = (this.idf[token] || 0) + 1;
    }
  }

  finalize() {
    this.avgDocLength /= this.docCount;

    for (const token in this.idf) {
      this.idf[token] = Math.log(
        (this.docCount - this.idf[token] + 0.5) / (this.idf[token] + 0.5) + 1
      );
    }
  }

  score(query, doc) {
    const queryTokens = this.tokenize(query);
    const docTokens = this.tokenize(doc);
    const docLength = docTokens.length;

    let score = 0;

    for (const token of queryTokens) {
      const freq = docTokens.filter(t => t === token).length;
      const idf = this.idf[token] || 0;

      const numerator = idf * freq * (this.k1 + 1);
      const denominator =
        freq + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));

      score += numerator / denominator;
    }

    return score;
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(token => token.length > 0);
  }
}

module.exports = { BM25 };
