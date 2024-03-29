module.exports = {
	development:{
		name: 'Development API',
		version: '0.0.0',
		env: process.env.NODE_ENV || 'development',
		port: process.env.PORT || 3000,
		base_url: process.env.BASE_URL || 'http://localhost:3000',
		db: {
			uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
		},
		client_url: 'http://localhost:4200'
	},

	production:{
		name: 'Production API',
		version: '1.0.0',
		env: process.env.NODE_ENV || 'production',
		port: process.env.PORT || 3000,
		base_url: process.env.BASE_URL || 'http://localhost:3000',
		db: {
			uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ProjectManager',
		},
	},

	dir: {
		avatars: 'C:\\Users\\marcv\\Documents\\APIs Projects\\ProjectManagerAPI\\files\\avatars\\',
		attachments: 'C:\\Users\\marcv\\Documents\\APIs Projects\\ProjectManagerAPI\\files\\attachments\\'
	}
};