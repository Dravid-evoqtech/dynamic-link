import { EnrollmentType } from "../../models/userData/enrollmentType.model.js";

const getEnrollmentTypeId = async (enrollmentType) => {
    const id = await EnrollmentType.findOne({ title: enrollmentType }).select("_id");
    if (id) {
        return id._id;
    }
    return null;
}

export default getEnrollmentTypeId