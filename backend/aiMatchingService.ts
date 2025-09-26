import { GoogleGenerativeAI } from '@google/generative-ai';

interface FreelancerProfile {
  id: string;
  skills: string[];
  experience: number;
  hourlyRate: number;
  rating: number;
  completedProjects: number;
  specializations: string[];
  availability: 'full-time' | 'part-time' | 'contract';
  location: string;
  languages: string[];
}

interface ProjectRequirements {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  budget: {
    min: number;
    max: number;
  };
  duration: string;
  complexity: 'beginner' | 'intermediate' | 'expert';
  category: string;
  location?: string;
  remote: boolean;
}

interface MatchScore {
  freelancerId: string;
  projectId: string;
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  budgetMatch: number;
  availabilityMatch: number;
  locationMatch: number;
  ratingScore: number;
  explanation: string;
}

class AIMatchingService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    // Initialize Google Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Calculate skill match score between freelancer and project
   */
  private calculateSkillMatch(freelancerSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 1;
    
    const matchedSkills = freelancerSkills.filter(skill => 
      requiredSkills.some(required => 
        skill.toLowerCase().includes(required.toLowerCase()) ||
        required.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    return Math.min(matchedSkills.length / requiredSkills.length, 1);
  }

  /**
   * Calculate experience match based on project complexity
   */
  private calculateExperienceMatch(freelancerExp: number, complexity: string): number {
    const requiredExp = {
      'beginner': 1,
      'intermediate': 3,
      'expert': 5
    };
    
    const required = requiredExp[complexity as keyof typeof requiredExp] || 1;
    
    if (freelancerExp >= required) {
      return 1;
    }
    
    return Math.max(freelancerExp / required, 0.3);
  }

  /**
   * Calculate budget compatibility
   */
  private calculateBudgetMatch(hourlyRate: number, budget: { min: number; max: number }): number {
    if (hourlyRate >= budget.min && hourlyRate <= budget.max) {
      return 1;
    }
    
    if (hourlyRate < budget.min) {
      return Math.max(hourlyRate / budget.min, 0.5);
    }
    
    if (hourlyRate > budget.max) {
      return Math.max(budget.max / hourlyRate, 0.3);
    }
    
    return 0.5;
  }

  /**
   * Calculate location match
   */
  private calculateLocationMatch(
    freelancerLocation: string,
    projectLocation?: string,
    remote: boolean = true
  ): number {
    if (remote) return 1;
    
    if (!projectLocation) return 0.8;
    
    const isSameLocation = freelancerLocation.toLowerCase().includes(projectLocation.toLowerCase()) ||
                          projectLocation.toLowerCase().includes(freelancerLocation.toLowerCase());
    
    return isSameLocation ? 1 : 0.3;
  }

  /**
   * Generate AI-powered match explanation
   */
  private async generateMatchExplanation(
    freelancer: FreelancerProfile,
    project: ProjectRequirements,
    scores: Partial<MatchScore>
  ): Promise<string> {
    const prompt = `
      Analyze the match between a freelancer and a project. Provide a concise explanation (2-3 sentences) of why they are a good/poor match.
      
      Freelancer:
      - Skills: ${freelancer.skills.join(', ')}
      - Experience: ${freelancer.experience} years
      - Rate: $${freelancer.hourlyRate}/hour
      - Rating: ${freelancer.rating}/5
      - Completed Projects: ${freelancer.completedProjects}
      - Availability: ${freelancer.availability}
      
      Project:
      - Title: ${project.title}
      - Required Skills: ${project.requiredSkills.join(', ')}
      - Budget: $${project.budget.min}-${project.budget.max}/hour
      - Complexity: ${project.complexity}
      - Duration: ${project.duration}
      
      Match Scores:
      - Overall: ${(scores.overallScore || 0) * 100}%
      - Skills: ${(scores.skillsMatch || 0) * 100}%
      - Experience: ${(scores.experienceMatch || 0) * 100}%
      - Budget: ${(scores.budgetMatch || 0) * 100}%
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating AI explanation:', error);
      return 'AI explanation temporarily unavailable.';
    }
  }

  /**
   * Calculate comprehensive match score between freelancer and project
   */
  async calculateMatch(
    freelancer: FreelancerProfile,
    project: ProjectRequirements
  ): Promise<MatchScore> {
    // Calculate individual match scores
    const skillsMatch = this.calculateSkillMatch(freelancer.skills, project.requiredSkills);
    const experienceMatch = this.calculateExperienceMatch(freelancer.experience, project.complexity);
    const budgetMatch = this.calculateBudgetMatch(freelancer.hourlyRate, project.budget);
    const locationMatch = this.calculateLocationMatch(
      freelancer.location,
      project.location,
      project.remote
    );
    
    // Rating score (normalized)
    const ratingScore = Math.min(freelancer.rating / 5, 1);
    
    // Availability match (simplified)
    const availabilityMatch = freelancer.availability === 'full-time' ? 1 : 0.8;
    
    // Calculate weighted overall score
    const weights = {
      skills: 0.35,
      experience: 0.25,
      budget: 0.15,
      rating: 0.1,
      location: 0.1,
      availability: 0.05
    };
    
    const overallScore = (
      skillsMatch * weights.skills +
      experienceMatch * weights.experience +
      budgetMatch * weights.budget +
      ratingScore * weights.rating +
      locationMatch * weights.location +
      availabilityMatch * weights.availability
    );
    
    const matchScore: MatchScore = {
      freelancerId: freelancer.id,
      projectId: project.id,
      overallScore,
      skillsMatch,
      experienceMatch,
      budgetMatch,
      availabilityMatch,
      locationMatch,
      ratingScore,
      explanation: 'Generating explanation...'
    };
    
    // Generate AI explanation
    try {
      matchScore.explanation = await this.generateMatchExplanation(freelancer, project, matchScore);
    } catch (error) {
      console.error('Error generating explanation:', error);
      matchScore.explanation = `Strong match based on ${Math.round(overallScore * 100)}% compatibility across skills, experience, and project requirements.`;
    }
    
    return matchScore;
  }

  /**
   * Find best matching freelancers for a project
   */
  async findMatchingFreelancers(
    project: ProjectRequirements,
    freelancers: FreelancerProfile[],
    limit: number = 10
  ): Promise<MatchScore[]> {
    const matches: MatchScore[] = [];
    
    // Calculate matches in parallel
    const matchPromises = freelancers.map(freelancer => 
      this.calculateMatch(freelancer, project)
    );
    
    const results = await Promise.all(matchPromises);
    matches.push(...results);
    
    // Sort by overall score (descending) and return top matches
    return matches
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit);
  }

  /**
   * Find best matching projects for a freelancer
   */
  async findMatchingProjects(
    freelancer: FreelancerProfile,
    projects: ProjectRequirements[],
    limit: number = 10
  ): Promise<MatchScore[]> {
    const matches: MatchScore[] = [];
    
    // Calculate matches in parallel
    const matchPromises = projects.map(project => 
      this.calculateMatch(freelancer, project)
    );
    
    const results = await Promise.all(matchPromises);
    matches.push(...results);
    
    // Sort by overall score (descending) and return top matches
    return matches
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit);
  }

  /**
   * Get AI-powered recommendations for improving match scores
   */
  async getMatchingRecommendations(
    freelancer: FreelancerProfile,
    project: ProjectRequirements
  ): Promise<{
    forFreelancer: string[];
    forProject: string[];
  }> {
    const match = await this.calculateMatch(freelancer, project);
    
    const prompt = `
      Based on the following matching analysis, provide 3 specific recommendations for both the freelancer and the project owner to improve their compatibility:
      
      Freelancer Profile:
      - Skills: ${freelancer.skills.join(', ')}
      - Experience: ${freelancer.experience} years
      - Rate: $${freelancer.hourlyRate}/hour
      
      Project Requirements:
      - Title: ${project.title}
      - Required Skills: ${project.requiredSkills.join(', ')}
      - Budget: $${project.budget.min}-${project.budget.max}/hour
      - Complexity: ${project.complexity}
      
      Current Match Scores:
      - Skills Match: ${Math.round(match.skillsMatch * 100)}%
      - Experience Match: ${Math.round(match.experienceMatch * 100)}%
      - Budget Match: ${Math.round(match.budgetMatch * 100)}%
      
      Provide recommendations in this format:
      FREELANCER:
      1. [recommendation]
      2. [recommendation]
      3. [recommendation]
      
      PROJECT:
      1. [recommendation]
      2. [recommendation]
      3. [recommendation]
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse recommendations (simplified parsing)
      const sections = text.split('PROJECT:');
      const freelancerSection = sections[0].replace('FREELANCER:', '').trim();
      const projectSection = sections[1]?.trim() || '';
      
      const parseRecommendations = (section: string): string[] => {
        return section
          .split('\n')
          .filter(line => /^\d+\./.test(line.trim()))
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(rec => rec.length > 0)
          .slice(0, 3);
      };
      
      return {
        forFreelancer: parseRecommendations(freelancerSection),
        forProject: parseRecommendations(projectSection)
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return {
        forFreelancer: [
          'Update your skills based on market demand',
          'Build a stronger portfolio with relevant projects',
          'Consider adjusting your hourly rate to be more competitive'
        ],
        forProject: [
          'Review and refine your skill requirements',
          'Consider adjusting your budget range',
          'Provide more detailed project descriptions'
        ]
      };
    }
  }
}

export default AIMatchingService;
export { FreelancerProfile, ProjectRequirements, MatchScore };
