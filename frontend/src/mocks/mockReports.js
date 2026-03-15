export const mockReports = [
  {
    id: 1,
    title: 'Massive Pothole on Durbar Marg',
    description:
      'A large pothole has formed near the intersection of Durbar Marg and Kantipath. Multiple vehicles have been damaged. The pothole is approximately 2 feet wide and 8 inches deep, posing a serious hazard especially at night when visibility is low.',
    category: 'road_damage',
    location: {
      lat: 27.7142,
      lng: 85.3145,
      address: 'Durbar Marg, Kathmandu',
      ward: 'Ward 31',
    },
    images: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600',
    ],
    status: 'under-review',
    upvotes: 47,
    comment_count: 12,
    reporter: {
      id: 'u1',
      name: 'Aarav Sharma',
      avatar: null,
    },

    // AI-generated fields
    ai_severity: 'critical',
    ai_category: 'road_damage',
    ai_summary:
      'Critical road damage detected: large pothole (2ft wide, 8in deep) on a major arterial road. High vehicle damage risk. Immediate repair recommended.',
    ai_priority_score: 92,
    ai_duplicate_flag: false,
    ai_duplicate_of: null,
    ai_sentiment: 'urgent',
    ai_tags: ['pothole', 'road-damage', 'vehicle-hazard', 'night-danger'],
    ai_estimated_cost: 'NPR 25,000 - 50,000',
    ai_department: 'Roads Division',

    created_at: '2026-03-14T08:30:00Z',
    updated_at: '2026-03-14T14:15:00Z',
  },
  {
    id: 2,
    title: 'Broken Street Light Near Thamel Chowk',
    description:
      'The street light at Thamel Chowk junction has been non-functional for over two weeks. The area becomes very dark at night, creating safety concerns for pedestrians and increasing the risk of accidents in this busy tourist area.',
    category: 'electrical',
    location: {
      lat: 27.7153,
      lng: 85.3123,
      address: 'Thamel Chowk, Kathmandu',
      ward: 'Ward 26',
    },
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600',
    ],
    status: 'in-progress',
    upvotes: 31,
    comment_count: 8,
    reporter: {
      id: 'u2',
      name: 'Priya Adhikari',
      avatar: null,
    },

    ai_severity: 'high',
    ai_category: 'electrical',
    ai_summary:
      'Non-functional street light at major tourist intersection. Dark conditions for 2+ weeks create pedestrian safety risks. Priority repair needed.',
    ai_priority_score: 78,
    ai_duplicate_flag: false,
    ai_duplicate_of: null,
    ai_sentiment: 'concerned',
    ai_tags: ['street-light', 'electrical', 'safety', 'tourist-area'],
    ai_estimated_cost: 'NPR 5,000 - 15,000',
    ai_department: 'Electrical Division',

    created_at: '2026-03-12T10:45:00Z',
    updated_at: '2026-03-13T16:30:00Z',
  },
  {
    id: 3,
    title: 'Water Leak on Pulchowk Road',
    description:
      'A significant water pipe leak has been running for 3 days on Pulchowk Road near the engineering campus. Water is flooding onto the road surface causing traffic issues and water wastage. The leak appears to be from a main supply pipe.',
    category: 'water_sanitation',
    location: {
      lat: 27.6811,
      lng: 85.3189,
      address: 'Pulchowk Road, Lalitpur',
      ward: 'Ward 11',
    },
    images: [
      'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=600',
    ],
    status: 'submitted',
    upvotes: 23,
    comment_count: 5,
    reporter: {
      id: 'u3',
      name: 'Bikash Tamang',
      avatar: null,
    },

    ai_severity: 'high',
    ai_category: 'water_sanitation',
    ai_summary:
      'Major water pipe leak running 3 days. Road flooding and significant water wastage from main supply line. Urgent plumbing intervention required.',
    ai_priority_score: 85,
    ai_duplicate_flag: false,
    ai_duplicate_of: null,
    ai_sentiment: 'frustrated',
    ai_tags: ['water-leak', 'pipe-burst', 'flooding', 'water-wastage'],
    ai_estimated_cost: 'NPR 30,000 - 80,000',
    ai_department: 'Water Supply Division',

    created_at: '2026-03-13T06:20:00Z',
    updated_at: '2026-03-13T06:20:00Z',
  },
  {
    id: 4,
    title: 'Garbage Overflow at Balaju Chowk',
    description:
      'The garbage collection point at Balaju Chowk has not been cleared for over a week. Trash is overflowing onto the sidewalk and street, creating unsanitary conditions and a strong odor. Stray animals are scattering waste further.',
    category: 'waste_management',
    location: {
      lat: 27.7282,
      lng: 85.3013,
      address: 'Balaju Chowk, Kathmandu',
      ward: 'Ward 16',
    },
    images: [
      'https://images.unsplash.com/photo-1567393528677-d6adae7d4a0a?w=600',
    ],
    status: 'submitted',
    upvotes: 56,
    comment_count: 19,
    reporter: {
      id: 'u4',
      name: 'Sunita KC',
      avatar: null,
    },

    ai_severity: 'medium',
    ai_category: 'waste_management',
    ai_summary:
      'Week-long garbage collection failure at major intersection. Overflow causing sanitation issues and animal scattering. Routine collection needed.',
    ai_priority_score: 68,
    ai_duplicate_flag: true,
    ai_duplicate_of: null,
    ai_sentiment: 'angry',
    ai_tags: ['garbage', 'waste', 'overflow', 'sanitation', 'stray-animals'],
    ai_estimated_cost: 'NPR 10,000 - 20,000',
    ai_department: 'Waste Management Division',

    created_at: '2026-03-11T14:00:00Z',
    updated_at: '2026-03-14T09:00:00Z',
  },
  {
    id: 5,
    title: 'Cracked Sidewalk Near Patan Durbar Square',
    description:
      'Multiple sections of the sidewalk near Patan Durbar Square are severely cracked and uneven, making it difficult for elderly and disabled people to walk. Some sections have risen by 2-3 inches creating tripping hazards.',
    category: 'road_damage',
    location: {
      lat: 27.6727,
      lng: 85.3252,
      address: 'Near Patan Durbar Square, Lalitpur',
      ward: 'Ward 18',
    },
    images: [
      'https://images.unsplash.com/photo-1588858679076-810085400e31?w=600',
    ],
    status: 'resolved',
    upvotes: 18,
    comment_count: 7,
    reporter: {
      id: 'u5',
      name: 'Rajesh Maharjan',
      avatar: null,
    },

    ai_severity: 'low',
    ai_category: 'road_damage',
    ai_summary:
      'Cracked and uneven sidewalk sections near heritage site. Accessibility concern for elderly/disabled. Non-urgent repair scheduled.',
    ai_priority_score: 42,
    ai_duplicate_flag: false,
    ai_duplicate_of: null,
    ai_sentiment: 'mildly_concerned',
    ai_tags: ['sidewalk', 'crack', 'accessibility', 'tripping-hazard'],
    ai_estimated_cost: 'NPR 15,000 - 35,000',
    ai_department: 'Roads Division',

    created_at: '2026-03-08T11:30:00Z',
    updated_at: '2026-03-14T10:00:00Z',
  },
  {
    id: 6,
    title: 'Public Park Vandalism in Ratna Park',
    description:
      'Several benches and a public fountain have been vandalized in Ratna Park. Graffiti has been sprayed on the monument and two trash bins have been destroyed. Security lighting in the park is also not functioning properly.',
    category: 'public_space',
    location: {
      lat: 27.7045,
      lng: 85.3145,
      address: 'Ratna Park, Kathmandu',
      ward: 'Ward 28',
    },
    images: [
      'https://images.unsplash.com/photo-1598128558393-70ff21f8be44?w=600',
    ],
    status: 'rejected',
    upvotes: 9,
    comment_count: 3,
    reporter: {
      id: 'u6',
      name: 'Anita Gurung',
      avatar: null,
    },

    ai_severity: 'medium',
    ai_category: 'public_space',
    ai_summary:
      'Vandalism of public amenities including benches, fountain, and monument graffiti. Security lighting failure compounds the issue. Restoration needed.',
    ai_priority_score: 55,
    ai_duplicate_flag: false,
    ai_duplicate_of: null,
    ai_sentiment: 'disappointed',
    ai_tags: ['vandalism', 'park', 'graffiti', 'public-property'],
    ai_estimated_cost: 'NPR 50,000 - 120,000',
    ai_department: 'Parks & Recreation Division',

    created_at: '2026-03-10T16:45:00Z',
    updated_at: '2026-03-12T08:30:00Z',
  },
];
