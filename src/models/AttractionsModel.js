// models/AttractionsModel.js (hoặc đường dẫn bạn đang dùng)
const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const { Schema, Types } = mongoose;

const STATUS = ['ACTIVE', 'PENDING', 'DELETED'];

const attractionsSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    list_image: { type: [String], default: [] },

    categoryId: { type: Types.ObjectId, ref: 'Category', default: null },
    typeId: { type: Types.ObjectId, ref: 'Type', default: null },

    address: {
      provinceId: { type: Types.ObjectId, ref: 'Province', required: true },
      districtId: { type: Types.ObjectId, ref: 'District', required: true },
      wardId: { type: Types.ObjectId, ref: 'Ward', required: true },
      detail: { type: String, default: '', trim: true },
    },

    status: {
      type: String,
      enum: STATUS,
      default: 'ACTIVE',
      set: (v) => (v ? String(v).toUpperCase().trim() : v),
    },

    isFree: { type: Boolean, default: false },
    minPrice: { type: Number, default: 0, min: 0 },
    maxPrice: { type: Number, default: 0, min: 0 },

    // ⏰ Thời gian mở/đóng cửa
    openTime: { type: Date, default: Date.now },
    closeTime: { type: Date, default: Date.now },

    createdBy: { type: Types.ObjectId, ref: 'User', default: null },
    slug: { type: String, slug: 'name', unique: true, slugPaddingSize: 3 },
    description: { type: String, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

attractionsSchema.index({ slug: 1 }, { unique: true });
attractionsSchema.index({ status: 1, 'address.provinceId': 1, typeId: 1 });

const Attractions = mongoose.model('Attractions', attractionsSchema);
module.exports = Attractions;
