package model

import (
	"fmt"

	"gorm.io/gorm"
)

func ensureTopupOrderBusinessTypeWithDB(tx *gorm.DB) error {
	if tx == nil {
		return fmt.Errorf("database handle is nil")
	}
	if err := tx.AutoMigrate(&TopupOrder{}); err != nil {
		return err
	}
	return tx.Exec(
		`UPDATE topup_orders
		 SET business_type = CASE
		   WHEN COALESCE(TRIM(package_id), '') <> '' THEN ?
		   ELSE ?
		 END
		 WHERE COALESCE(TRIM(business_type), '') = ''
		    OR TRIM(business_type) NOT IN (?, ?)`,
		TopupOrderBusinessPackage,
		TopupOrderBusinessBalance,
		TopupOrderBusinessBalance,
		TopupOrderBusinessPackage,
	).Error
}
